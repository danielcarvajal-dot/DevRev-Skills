import { extractEmail, extractUserId, extractUsername, parseCommandParameters } from './email';
import { KeycloakError, RecoveryAction, UserLookup } from './types';

export function inferAction(event: {
  execution_metadata?: { function_name?: string };
  payload?: { command_id?: string };
}): RecoveryAction {
  const commandId = event.payload?.command_id ?? '';
  const functionName = event.execution_metadata?.function_name ?? '';
  const haystack = `${commandId} ${functionName}`.toLowerCase();

  if (haystack.includes('send-otp') || haystack.includes('send_otp')) {
    return 'send_otp';
  }
  if (haystack.includes('unlock-account') || haystack.includes('unlock_account')) {
    return 'unlock';
  }
  if (haystack.includes('check-account') || haystack.includes('check_account')) {
    return 'check';
  }
  return 'reset';
}

export function emailFromWork(work: {
  title?: string;
  body?: string;
  reported_by?: Array<{ email?: string }>;
}): string | undefined {
  return identityFromWork(work).email;
}

export function identityFromWork(work: {
  title?: string;
  body?: string;
  reported_by?: Array<{ email?: string }>;
}): UserLookup {
  return {
    email:
      extractEmail(work.title) ||
      extractEmail(work.body) ||
      work.reported_by?.map((reporter) => reporter.email).find((email) => Boolean(email)),
    userId: extractUserId(work.title) || extractUserId(work.body),
    username: extractUsername(work.title) || extractUsername(work.body),
  };
}

export function requireLookup(identity: { email?: string; userId?: string; username?: string }): {
  email?: string;
  userId?: string;
  username?: string;
} {
  if (!identity.email && !identity.userId && !identity.username) {
    throw new KeycloakError(
      'Please include the Keycloak email or username, for example `/reset_password user@example.com` or `/unlock_account danielcarvajal`.'
    );
  }
  return identity;
}

export function commandOptions(event: { payload?: { parameters?: string } }): {
  email?: string;
  userId?: string;
  username?: string;
  otp?: string;
  temp: boolean;
} {
  return parseCommandParameters(event.payload?.parameters);
}
