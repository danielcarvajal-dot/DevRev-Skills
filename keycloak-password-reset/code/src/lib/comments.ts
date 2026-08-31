import { client } from '@devrev/typescript-sdk';

import { AccountStatus, RecoveryResult } from './types';

export type CommentVisibility = 'internal' | 'external';

export function displayName(user: { firstName?: string; lastName?: string; username?: string; email?: string }): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.username || user.email || user.username || 'the user';
}

export function formatAccountStatus(status: AccountStatus): string {
  const { user, lockout } = status;
  const locked = lockout.disabled ? 'yes' : 'no';
  const enabled = user.enabled === false ? 'no' : 'yes';
  const failures = typeof lockout.numFailures === 'number' ? String(lockout.numFailures) : 'unknown';

  return [
    `Keycloak account for **${user.email || displayName(user)}**`,
    `- Username: ${user.username ?? 'n/a'}`,
    `- Enabled: ${enabled}`,
    `- Brute-force locked: ${locked}`,
    `- Failed login attempts: ${failures}`,
    `- User ID: ${user.id}`,
  ].join('\n');
}

export function formatRecoveryComment(result: RecoveryResult): string {
  const lines = [formatAccountStatus({ user: result.user, lockout: result.lockout })];

  if (result.wasLocked && result.unlocked) {
    lines.push('\nCleared the brute-force lockout.');
  } else if (!result.wasLocked && result.action !== 'check') {
    lines.push('\nAccount was not brute-force locked.');
  }

  if (result.wasDisabled && result.enabled) {
    lines.push('Re-enabled the user.');
  }

  if (result.resetEmailSent) {
    lines.push(`Sent a password-reset email to ${result.email}. The user should use the Keycloak link to set a new password.`);
  } else if (result.resetEmailError) {
    lines.push(`Could not send the password-reset email: ${result.resetEmailError}`);
    lines.push('The account was still unlocked/enabled. Use `/reset_password user@example.com --temp` if you need a temporary password for the demo.');
  }

  if (result.temporaryPassword) {
    lines.push(`Set a temporary password. The user must change it at next login.`);
    lines.push(`Temporary password: \`${result.temporaryPassword}\``);
  }

  return lines.join('\n');
}

export function usageHint(): string {
  return [
    'I can recover a Keycloak account from this discussion:',
    '- `/reset_password user@example.com` — unlock, enable, and email a reset link (Keycloak user ID also works)',
    '- `/reset_password user@example.com --temp` — unlock, enable, and set a temporary password (posted internally)',
    '- `/unlock_account user@example.com` — clear lockout and enable only',
    '- `/check_account user@example.com` — report lockout and enabled status',
  ].join('\n');
}

export function createDevRevClient(event: {
  context?: { secrets?: { service_account_token?: string } };
  execution_metadata?: { devrev_endpoint?: string };
}) {
  const endpoint = event.execution_metadata?.devrev_endpoint;
  const token = event.context?.secrets?.service_account_token;
  if (!endpoint || !token) {
    throw new Error('Missing DevRev endpoint or service account token on the event');
  }
  return client.setup({ endpoint, token });
}

export async function postComment(
  event: {
    context?: { secrets?: { service_account_token?: string } };
    execution_metadata?: { devrev_endpoint?: string };
  },
  objectId: string,
  body: string,
  visibility: CommentVisibility = 'external'
): Promise<void> {
  const sdk = createDevRevClient(event);
  await sdk.timelineEntriesCreate({
    body,
    object: objectId,
    type: 'timeline_comment',
    visibility,
  } as any);
}
