import axios from 'axios';

import { emailAliases, generateTemporaryPassword, usernameAliases } from './email';
import { wrapHttpError } from './http-error';
import {
  OTP_ATTRIBUTE,
  OTP_EXPIRES_ATTRIBUTE,
  OTP_TTL_MS,
  OtpMailer,
  codesEqual,
  generateOtp,
  maskEmail,
  readAttribute,
  sendOtpEmail,
  userWritePayload,
} from './otp';
import {
  AccountStatus,
  BruteForceStatus,
  HttpClient,
  KeycloakConfig,
  KeycloakError,
  KeycloakUser,
  RecoveryAction,
  RecoveryResult,
  UserLookup,
} from './types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TokenResponse = {
  access_token: string;
  expires_in?: number;
};

export class KeycloakClient {
  private cachedToken?: { value: string; expiresAt: number };

  constructor(
    private readonly config: KeycloakConfig,
    private readonly http: HttpClient = axios,
    private readonly mailer: OtpMailer = sendOtpEmail
  ) {}

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      // Free ngrok interstitials break non-browser Admin API clients unless this is set.
      'ngrok-skip-browser-warning': 'true',
      ...extra,
    };
  }

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 5000) {
      return this.cachedToken.value;
    }

    const tokenUrl = `${this.config.url}realms/${encodeURIComponent(this.config.realm)}/protocol/openid-connect/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      const response = await this.http.post<TokenResponse>(tokenUrl, body.toString(), {
        headers: this.headers({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      });
      const accessToken = response.data?.access_token;
      if (!accessToken) {
        throw new KeycloakError('Keycloak token response did not include access_token');
      }
      const expiresIn = typeof response.data.expires_in === 'number' ? response.data.expires_in : 60;
      this.cachedToken = {
        value: accessToken,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      return accessToken;
    } catch (error) {
      if (error instanceof KeycloakError) {
        throw error;
      }
      throw wrapHttpError(error, 'Failed to obtain a Keycloak access token.');
    }
  }

  async findUserByEmail(email: string): Promise<KeycloakUser | null> {
    return this.findUsers({ email, exact: true }, (user) => user.email?.toLowerCase() === email.toLowerCase());
  }

  async findUserByUsername(username: string): Promise<KeycloakUser | null> {
    return this.findUsers({ username, exact: true }, (user) => user.username?.toLowerCase() === username.toLowerCase());
  }

  async findUserBySearch(query: string): Promise<KeycloakUser | null> {
    const needle = query.toLowerCase();
    return this.findUsers({ search: query }, (user) => {
      return (
        user.username?.toLowerCase() === needle ||
        user.email?.toLowerCase() === needle ||
        user.username?.toLowerCase().replace(/[-_.]/g, '') === needle.replace(/[-_.]/g, '')
      );
    });
  }

  async resolveUser(lookup: UserLookup | string): Promise<KeycloakUser | null> {
    const identity = this.normalizeLookup(lookup);
    if (identity.userId) {
      return this.getUser(identity.userId);
    }

    if (identity.email) {
      for (const email of emailAliases(identity.email)) {
        const match = await this.findUserByEmail(email);
        if (match) {
          return match;
        }
      }
    }

    if (identity.username) {
      for (const username of usernameAliases(identity.username)) {
        const match = await this.findUserByUsername(username);
        if (match) {
          return match;
        }
      }
    }

    const searchTerms = [identity.email, identity.username].filter((value): value is string => Boolean(value));
    for (const term of searchTerms) {
      for (const alias of term.includes('@') ? emailAliases(term) : usernameAliases(term)) {
        const match = await this.findUserBySearch(alias);
        if (match) {
          return match;
        }
      }
    }

    return null;
  }

  private normalizeLookup(lookup: UserLookup | string): UserLookup {
    if (typeof lookup !== 'string') {
      return lookup;
    }
    const value = lookup.trim();
    if (UUID_PATTERN.test(value)) {
      return { userId: value };
    }
    if (value.includes('@')) {
      return { email: value };
    }
    return { username: value };
  }

  private async findUsers(
    params: Record<string, string | number | boolean | undefined>,
    prefer?: (user: KeycloakUser) => boolean
  ): Promise<KeycloakUser | null> {
    const token = await this.getAccessToken();
    const url = `${this.config.url}admin/realms/${encodeURIComponent(this.config.realm)}/users`;

    try {
      const response = await this.http.get<KeycloakUser[]>(url, {
        headers: this.headers({ Authorization: `Bearer ${token}` }),
        params,
      });
      const users = Array.isArray(response.data) ? response.data : [];
      if (users.length === 0) {
        return null;
      }
      return (prefer && users.find(prefer)) || users[0];
    } catch (error) {
      throw wrapHttpError(error, `Failed to look up Keycloak user ${JSON.stringify(params)}.`);
    }
  }

  async getUser(userId: string): Promise<KeycloakUser> {
    const token = await this.getAccessToken();
    const url = `${this.config.url}admin/realms/${encodeURIComponent(this.config.realm)}/users/${encodeURIComponent(userId)}`;

    try {
      const response = await this.http.get<KeycloakUser>(url, {
        headers: this.headers({ Authorization: `Bearer ${token}` }),
      });
      return response.data;
    } catch (error) {
      throw wrapHttpError(error, 'Failed to load the Keycloak user.');
    }
  }

  async checkLockout(userId: string): Promise<BruteForceStatus> {
    const token = await this.getAccessToken();
    const url = `${this.config.url}admin/realms/${encodeURIComponent(
      this.config.realm
    )}/attack-detection/brute-force/users/${encodeURIComponent(userId)}`;

    try {
      const response = await this.http.get<BruteForceStatus>(url, {
        headers: this.headers({ Authorization: `Bearer ${token}` }),
      });
      return response.data ?? {};
    } catch (error) {
      throw wrapHttpError(error, 'Failed to check Keycloak brute-force lockout status.');
    }
  }

  async unlockUser(userId: string): Promise<void> {
    const token = await this.getAccessToken();
    const url = `${this.config.url}admin/realms/${encodeURIComponent(
      this.config.realm
    )}/attack-detection/brute-force/users/${encodeURIComponent(userId)}`;

    try {
      await this.http.delete(url, {
        headers: this.headers({ Authorization: `Bearer ${token}` }),
      });
    } catch (error) {
      throw wrapHttpError(error, 'Failed to clear the Keycloak brute-force lockout.');
    }
  }

  async enableUser(user: KeycloakUser): Promise<KeycloakUser> {
    const token = await this.getAccessToken();
    const url = `${this.config.url}admin/realms/${encodeURIComponent(this.config.realm)}/users/${encodeURIComponent(
      user.id
    )}`;
    // Keycloak merges this representation. Do not $merge / stringify the
    // Find User body — that is a JSON string and breaks skill workflows.
    const payload = { enabled: true };

    try {
      await this.http.put(url, payload, {
        headers: this.headers({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }),
      });
      return { ...user, enabled: true };
    } catch (error) {
      throw wrapHttpError(error, 'Failed to enable the Keycloak user.');
    }
  }

  async sendPasswordResetEmail(userId: string): Promise<void> {
    const token = await this.getAccessToken();
    const url = `${this.config.url}admin/realms/${encodeURIComponent(
      this.config.realm
    )}/users/${encodeURIComponent(userId)}/execute-actions-email`;
    const params: Record<string, string> = {};
    if (this.config.emailActionClientId) {
      params.client_id = this.config.emailActionClientId;
    }
    if (this.config.redirectUri) {
      params.redirect_uri = this.config.redirectUri;
    }

    try {
      await this.http.put(url, ['UPDATE_PASSWORD'], {
        headers: this.headers({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }),
        params,
      });
    } catch (error) {
      throw wrapHttpError(
        error,
        'Failed to send the Keycloak password-reset email. Confirm the realm has SMTP configured and the user has an email address.'
      );
    }
  }

  async setTemporaryPassword(userId: string, password: string): Promise<void> {
    const token = await this.getAccessToken();
    const url = `${this.config.url}admin/realms/${encodeURIComponent(
      this.config.realm
    )}/users/${encodeURIComponent(userId)}/reset-password`;

    try {
      await this.http.put(
        url,
        { type: 'password', temporary: true, value: password },
        {
          headers: this.headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }),
        }
      );
    } catch (error) {
      throw wrapHttpError(error, 'Failed to set a temporary Keycloak password.');
    }
  }

  async getAccountStatus(identity: UserLookup | string): Promise<AccountStatus> {
    const lookup = this.normalizeLookup(identity);
    const user = await this.resolveUser(lookup);
    if (!user) {
      throw new KeycloakError(
        `No Keycloak user found for ${lookup.email || lookup.username || lookup.userId || 'the given identity'}.`,
        404
      );
    }
    const lockout = await this.checkLockout(user.id);
    return { user, lockout };
  }

  async writeUserAttributes(
    user: KeycloakUser,
    attributes: Record<string, string[] | string>
  ): Promise<KeycloakUser> {
    const token = await this.getAccessToken();
    const url = `${this.config.url}admin/realms/${encodeURIComponent(this.config.realm)}/users/${encodeURIComponent(
      user.id
    )}`;
    const payload = userWritePayload(user, attributes);
    try {
      await this.http.put(url, payload, {
        headers: this.headers({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }),
      });
      return { ...user, attributes };
    } catch (error) {
      throw wrapHttpError(error, 'Failed to update Keycloak user attributes.');
    }
  }

  async sendUnlockOtp(identity: UserLookup | string): Promise<RecoveryResult> {
    const user = await this.resolveUser(this.normalizeLookup(identity));
    if (!user) {
      const lookup = this.normalizeLookup(identity);
      throw new KeycloakError(
        `No Keycloak user found for ${lookup.email || lookup.username || lookup.userId || 'the given identity'}.`,
        404
      );
    }
    const current = await this.getUser(user.id);
    if (!current.email) {
      throw new KeycloakError('This Keycloak user has no email address, so an OTP cannot be sent.');
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;
    const attributes = { ...(current.attributes || {}) };
    attributes[OTP_ATTRIBUTE] = [otp];
    attributes[OTP_EXPIRES_ATTRIBUTE] = [String(expiresAt)];
    await this.writeUserAttributes(current, attributes);

    const result: RecoveryResult = {
      action: 'send_otp',
      email: current.email,
      user: current,
      lockout: {},
      wasLocked: false,
      wasDisabled: current.enabled === false,
      unlocked: false,
      enabled: current.enabled !== false,
      resetEmailSent: false,
      otpSent: false,
      otpDestination: maskEmail(current.email),
    };

    try {
      await this.mailer(current.email, otp);
      result.otpSent = true;
    } catch (error) {
      result.otpEmailError = error instanceof Error ? error.message : 'Unknown error sending the OTP email';
    }

    return result;
  }

  async verifyUnlockOtp(identity: UserLookup | string, otp: string): Promise<KeycloakUser> {
    const code = (otp || '').trim();
    if (!/^\d{6}$/.test(code)) {
      throw new KeycloakError('Enter the 6-digit code from the email, then I can unlock the account.');
    }

    const user = await this.resolveUser(this.normalizeLookup(identity));
    if (!user) {
      const lookup = this.normalizeLookup(identity);
      throw new KeycloakError(
        `No Keycloak user found for ${lookup.email || lookup.username || lookup.userId || 'the given identity'}.`,
        404
      );
    }
    const current = await this.getUser(user.id);
    const stored = readAttribute(current.attributes, OTP_ATTRIBUTE);
    const expiresAt = Number(readAttribute(current.attributes, OTP_EXPIRES_ATTRIBUTE) || '0');
    const valid = codesEqual(code, stored) && expiresAt > Date.now();

    const attributes = { ...(current.attributes || {}) };
    delete attributes[OTP_ATTRIBUTE];
    delete attributes[OTP_EXPIRES_ATTRIBUTE];
    await this.writeUserAttributes(current, attributes);

    if (!valid) {
      throw new KeycloakError('That verification code is invalid or expired. Ask me to send a new OTP to the account email.');
    }
    return current;
  }

  async verifyAndRecover(
    identity: UserLookup | string,
    otp: string,
    options: { action: RecoveryAction; setTempPassword?: boolean; sendResetEmail?: boolean }
  ): Promise<RecoveryResult> {
    await this.verifyUnlockOtp(identity, otp);
    const result = await this.recoverAccount(identity, options);
    result.otpVerified = true;
    return result;
  }

  async recoverAccount(
    identity: UserLookup | string,
    options: { action: RecoveryAction; setTempPassword?: boolean; sendResetEmail?: boolean }
  ): Promise<RecoveryResult> {
    const { user, lockout } = await this.getAccountStatus(identity);
    const email =
      (typeof identity === 'string' ? identity : identity.email || identity.username) || user.email || user.id;
    const wasLocked = Boolean(lockout.disabled);
    const wasDisabled = user.enabled === false;
    let unlocked = false;
    let enabled = user.enabled !== false;
    let currentUser = user;
    let currentLockout = lockout;

    // Permanent lockout sets enabled: false. Clearing the brute-force counter
    // alone leaves the user disabled. Always unlock and re-enable on recover.
    if (options.action !== 'check' && options.action !== 'send_otp') {
      await this.unlockUser(user.id);
      unlocked = true;
      currentUser = await this.enableUser(user);
      enabled = true;
      currentLockout = await this.checkLockout(currentUser.id);
    }

    const result: RecoveryResult = {
      action: options.action,
      email,
      user: currentUser,
      lockout: currentLockout,
      wasLocked,
      wasDisabled,
      unlocked,
      enabled,
      resetEmailSent: false,
    };

    if (options.action === 'check' || options.action === 'unlock') {
      return result;
    }

    if (options.setTempPassword) {
      const temporaryPassword = generateTemporaryPassword();
      await this.setTemporaryPassword(currentUser.id, temporaryPassword);
      result.temporaryPassword = temporaryPassword;
      return result;
    }

    if (options.sendResetEmail !== false) {
      try {
        await this.sendPasswordResetEmail(currentUser.id);
        result.resetEmailSent = true;
      } catch (error) {
        result.resetEmailError = error instanceof Error ? error.message : 'Unknown error sending reset email';
      }
    }

    return result;
  }
}
