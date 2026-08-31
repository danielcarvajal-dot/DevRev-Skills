import { extractEmail, parseCommandParameters } from './email';
import { KeycloakError, RecoveryAction } from './types';

export function inferAction(event: {
  execution_metadata?: { function_name?: string };
  payload?: { command_id?: string };
}): RecoveryAction {
  const commandId = event.payload?.command_id ?? '';
  const functionName = event.execution_metadata?.function_name ?? '';
  const haystack = `${commandId} ${functionName}`.toLowerCase();

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
  return (
    extractEmail(work.title) ||
    extractEmail(work.body) ||
    work.reported_by?.map((reporter) => reporter.email).find((email) => Boolean(email))
  );
}

export function requireEmail(email: string | undefined): string {
  if (!email) {
    throw new KeycloakError(
      'Please include the user email, for example `/reset_password user@example.com`.'
    );
  }
  return email;
}

export function commandOptions(event: { payload?: { parameters?: string } }): {
  email?: string;
  temp: boolean;
} {
  return parseCommandParameters(event.payload?.parameters);
}
