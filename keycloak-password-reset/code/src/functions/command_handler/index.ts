import { commandOptions, emailFromWork, inferAction, requireLookup } from '../../lib/command';
import { formatAccountStatus, formatRecoveryComment, postComment, usageHint } from '../../lib/comments';
import { resolveConfig } from '../../lib/config';
import { KeycloakClient } from '../../lib/keycloak';
import { KeycloakError, RecoveryAction } from '../../lib/types';

type DevRevWorkClient = {
  worksGet: (args: { id: string }) => Promise<{ data?: { work?: { title?: string; body?: string; reported_by?: Array<{ email?: string }> } } }>;
};

export async function resolveEmail(event: any, sourceId: string, provided?: string): Promise<string | undefined> {
  if (provided) {
    return provided;
  }

  try {
    const { createDevRevClient } = await import('../../lib/comments');
    const sdk = createDevRevClient(event) as unknown as DevRevWorkClient;
    if (typeof sdk.worksGet !== 'function') {
      return undefined;
    }
    const response = await sdk.worksGet({ id: sourceId });
    return emailFromWork(response.data?.work ?? {});
  } catch (error) {
    console.warn('Could not load the work item to infer an email', error);
    return undefined;
  }
}

export async function handleEvent(event: any, forcedAction?: RecoveryAction): Promise<void> {
  const sourceId = event.payload?.source_id;
  if (!sourceId) {
    throw new KeycloakError('Command event is missing payload.source_id');
  }

  const action = forcedAction ?? inferAction(event);
  const { email: parameterEmail, userId, username, temp } = commandOptions(event);

  try {
    const identity = requireLookup({
      email: userId ? undefined : await resolveEmail(event, sourceId, parameterEmail),
      userId,
      username,
    });
    const client = new KeycloakClient(resolveConfig(event));

    if (action === 'check') {
      const status = await client.getAccountStatus(identity);
      await postComment(event, sourceId, `${formatAccountStatus(status)}\n\n${usageHint()}`);
      return;
    }

    const result = await client.recoverAccount(identity, {
      action,
      sendResetEmail: action === 'reset' && !temp,
      setTempPassword: action === 'reset' && temp,
    });

    const visibility = result.temporaryPassword ? 'internal' : 'external';
    await postComment(event, sourceId, formatRecoveryComment(result), visibility);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error talking to Keycloak';
    await postComment(event, sourceId, `Keycloak password reset failed: ${message}\n\n${usageHint()}`, 'internal');
  }
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
