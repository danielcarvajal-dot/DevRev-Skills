import { client } from '@devrev/typescript-sdk';

import { AccountStatus, RecoveryResult } from './types';

export type CommentVisibility = 'internal' | 'external';

export function displayName(user: { firstName?: string; lastName?: string; username?: string; email?: string }): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.username || user.email || 'the user';
}

export function formatAccountStatus(status: AccountStatus): string {
  const { user, lockout } = status;
  const locked = lockout.disabled ? 'yes' : 'no';
  const enabled = user.enabled === false ? 'no' : 'yes';
  const failures = typeof lockout.numFailures === 'number' ? String(lockout.numFailures) : 'unknown';

  const lines = [
    `Keycloak account for **${user.email || displayName(user)}**`,
    `- Username: ${user.username ?? 'n/a'}`,
    `- Enabled: ${enabled}`,
    `- Brute-force locked: ${locked}`,
    `- Failed login attempts: ${failures}`,
    `- User ID: ${user.id}`,
  ];
  if (user.enabled === false) {
    lines.push(
      '- Permanent lockout: yes (Keycloak disabled the user after failed logins)',
      '- Recovery: `/unlock_account` or `/reset_password` re-enables the user. Clearing the lockout counter alone is not enough.'
    );
  }
  return lines.join('\n');
}

export function formatRecoveryComment(result: RecoveryResult): string {
  if (result.action === 'send_otp') {
    const destination = result.otpDestination || result.email;
    if (result.otpSent) {
      return [
        `Sent a 6-digit unlock code to **${destination}**.`,
        'It expires in 10 minutes. Paste the code here, then run `/unlock_account <user> <code>`.',
      ].join('\n');
    }
    return [
      `Could not email the unlock code to **${destination}**.`,
      result.otpEmailError ? `Error: ${result.otpEmailError}` : '',
      'Confirm the Keycloak user has an email address and try `/send_otp` again.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const lines = [formatAccountStatus({ user: result.user, lockout: result.lockout })];

  if (result.wasLocked && result.unlocked) {
    lines.push('\nCleared the brute-force lockout counter.');
  } else if (!result.wasLocked && result.action !== 'check') {
    lines.push('\nAccount was not brute-force locked.');
  }

  if (result.wasDisabled && result.enabled) {
    lines.push('Re-enabled the user (lifted permanent lockout).');
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
    'I can recover any Keycloak user from this discussion (email, username, or user ID):',
    '- `/send_otp user@example.com` — email a 6-digit unlock code',
    '- `/unlock_account user@example.com 123456` — verify the code, then unlock and re-enable',
    '- `/reset_password user@example.com 123456` — verify the code, unlock, then email a reset link',
    '- `/reset_password danielcarvajal 123456 --temp` — same recovery with a temporary password (posted internally)',
    '- `/check_account user@example.com` — report lockout and enabled status (no OTP)',
    'Unlock and reset require the email OTP. DevRev logins on @devrev.ai also match the @devrev.com Keycloak mailbox.',
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
