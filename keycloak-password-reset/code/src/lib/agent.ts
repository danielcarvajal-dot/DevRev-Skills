import { extractEmail, extractUserId } from './email';
import { AccountStatus, RecoveryAction, RecoveryResult } from './types';

export type AgentRequest = {
  action: RecoveryAction;
  email?: string;
  userId?: string;
  temp: boolean;
};

export type AgentAccount = {
  email?: string;
  username?: string;
  user_id: string;
  enabled: boolean;
  locked: boolean;
  failed_logins?: number;
};

export type AgentResponse = {
  ok: boolean;
  action: RecoveryAction;
  message: string;
  account?: AgentAccount;
  reset_email_sent?: boolean;
  temporary_password?: string;
  error?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readBool(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'temp', '--temp'].includes(value.trim().toLowerCase());
  }
  return false;
}

function inferActionFromText(text: string): RecoveryAction | undefined {
  const haystack = text.toLowerCase();
  if (/\b(check|status|lookup|look\s*up)\b/.test(haystack)) {
    return 'check';
  }
  if (/\bunlock\b/.test(haystack) && !/\breset\b/.test(haystack)) {
    return 'unlock';
  }
  if (/\b(reset|password|forgot|temp)\b/.test(haystack)) {
    return 'reset';
  }
  return undefined;
}

export function parseAction(value: unknown): RecoveryAction | undefined {
  const raw = readString(value)?.toLowerCase();
  if (!raw) {
    return undefined;
  }
  const compact = raw.replace(/[_\s-]/g, '');
  if (compact === 'check' || compact === 'checkaccount' || compact === 'status') {
    return 'check';
  }
  if (compact === 'unlock' || compact === 'unlockaccount') {
    return 'unlock';
  }
  if (compact === 'reset' || compact === 'resetpassword' || compact === 'password') {
    return 'reset';
  }
  return inferActionFromText(raw);
}

export function parseAgentRequest(event: { payload?: Record<string, unknown> }): AgentRequest {
  const payload = asRecord(event.payload);
  const nested = asRecord(payload.parameters);
  const body = asRecord(payload.body);

  const parametersText =
    readString(payload.parameters) ?? readString(nested.text) ?? readString(payload.text) ?? readString(payload.query);

  const action =
    parseAction(payload.action) ??
    parseAction(nested.action) ??
    parseAction(body.action) ??
    inferActionFromText(parametersText ?? '') ??
    'reset';

  const email =
    readString(payload.email) ??
    readString(nested.email) ??
    readString(body.email) ??
    extractEmail(parametersText) ??
    extractEmail(readString(payload.user));

  const userId =
    readString(payload.user_id) ??
    readString(payload.userId) ??
    readString(nested.user_id) ??
    readString(body.user_id) ??
    extractUserId(parametersText);

  const temp =
    readBool(payload.temp) ||
    readBool(payload.set_temp_password) ||
    readBool(nested.temp) ||
    readBool(body.temp) ||
    /(?:^|\s)--temp(?:\s|$)/i.test(parametersText ?? '');

  return { action, email, userId, temp };
}

export function accountFromStatus(status: AccountStatus): AgentAccount {
  return {
    email: status.user.email,
    username: status.user.username,
    user_id: status.user.id,
    enabled: status.user.enabled !== false,
    locked: Boolean(status.lockout.disabled),
    failed_logins: typeof status.lockout.numFailures === 'number' ? status.lockout.numFailures : undefined,
  };
}

export function formatAgentResponse(input: {
  action: RecoveryAction;
  result?: RecoveryResult;
  status?: AccountStatus;
  error?: string;
}): AgentResponse {
  if (input.error) {
    return {
      ok: false,
      action: input.action,
      message: input.error,
      error: input.error,
    };
  }

  if (input.status) {
    const account = accountFromStatus(input.status);
    return {
      ok: true,
      action: 'check',
      message: [
        `Keycloak account ${account.email || account.user_id} is ${account.enabled ? 'enabled' : 'disabled'}`,
        `and ${account.locked ? 'brute-force locked' : 'not locked'}.`,
      ].join(' '),
      account,
    };
  }

  const result = input.result;
  if (!result) {
    return { ok: false, action: input.action, message: 'No Keycloak result', error: 'No Keycloak result' };
  }

  const account = accountFromStatus({ user: result.user, lockout: result.lockout });
  const parts: string[] = [];

  if (result.wasLocked && result.unlocked) {
    parts.push('Cleared the brute-force lockout.');
  }
  if (result.wasDisabled && result.enabled) {
    parts.push('Re-enabled the user.');
  }
  if (result.resetEmailSent) {
    parts.push(`Sent a password-reset email to ${result.email}.`);
  } else if (result.resetEmailError) {
    parts.push(`Could not send the password-reset email: ${result.resetEmailError}`);
    parts.push('Use temp=true to set a temporary password when realm SMTP is not configured.');
  }
  if (result.temporaryPassword) {
    parts.push('Set a temporary password. The user must change it at next login.');
  }
  if (parts.length === 0 && result.action === 'unlock') {
    parts.push('Account is unlocked and enabled. No lockout was present.');
  }
  if (parts.length === 0 && result.action === 'reset') {
    parts.push('Account recovery finished.');
  }

  return {
    ok: true,
    action: result.action,
    message: parts.join(' '),
    account,
    reset_email_sent: result.resetEmailSent || undefined,
    temporary_password: result.temporaryPassword,
  };
}
