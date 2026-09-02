import { KeycloakConfig, KeycloakError } from './types';

export function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

type SecretFields = {
  url?: string;
  realm?: string;
  clientId?: string;
  clientSecret?: string;
};

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}

function parseSecret(raw: unknown): SecretFields {
  if (!raw) {
    return {};
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return {
      url: readString(obj.url) ?? readString(obj.KEYCLOAK_URL),
      realm: readString(obj.realm) ?? readString(obj.REALM),
      clientId: readString(obj.client_id) ?? readString(obj.clientId),
      clientSecret: readString(obj.client_secret) ?? readString(obj.clientSecret) ?? readString(obj.secret),
    };
  }

  if (typeof raw !== 'string') {
    return {};
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith('{')) {
    try {
      return parseSecret(JSON.parse(trimmed));
    } catch {
      throw new KeycloakError('Keycloak connection secret is not valid JSON');
    }
  }

  return { clientSecret: trimmed };
}

function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => Boolean(value));
}

export function resolveConfig(event: { input_data?: { global_values?: Record<string, unknown>; keyrings?: Record<string, unknown> } }): KeycloakConfig {
  const globals = event.input_data?.global_values ?? {};
  const keyrings = event.input_data?.keyrings ?? {};
  const secret = parseSecret(keyrings.keycloak ?? keyrings.keycloak_client_secret);

  const url = firstDefined(readString(globals.keycloak_url), secret.url);
  const realm = firstDefined(readString(globals.realm), secret.realm, 'account-unlock');
  const clientId = firstDefined(readString(globals.client_id), secret.clientId, 'unlock-agent');
  const clientSecret = secret.clientSecret;
  const emailActionClientId = readString(globals.email_action_client_id);
  const redirectUri = readString(globals.redirect_uri);

  const missing: string[] = [];
  if (!url) {
    missing.push('Keycloak URL');
  }
  if (!realm) {
    missing.push('realm');
  }
  if (!clientId) {
    missing.push('client ID');
  }
  if (!clientSecret) {
    missing.push('client secret');
  }

  if (missing.length > 0) {
    throw new KeycloakError(
      `Missing Keycloak configuration: ${missing.join(', ')}. Add a Keycloak Admin connection (or snap-in secret) and the organization inputs.`
    );
  }

  return {
    url: normalizeBaseUrl(url as string),
    realm: realm as string,
    clientId: clientId as string,
    clientSecret: clientSecret as string,
    emailActionClientId,
    redirectUri,
  };
}
