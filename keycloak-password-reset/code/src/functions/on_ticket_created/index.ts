import { identityFromWork } from '../../lib/command';
import { formatAccountStatus, postComment, usageHint } from '../../lib/comments';
import { resolveConfig } from '../../lib/config';
import { looksLikePasswordResetRequest } from '../../lib/email';
import { KeycloakClient } from '../../lib/keycloak';

function workFromEvent(event: any) {
  return event.payload?.work_created?.work ?? event.payload?.work_updated?.work;
}

export async function handleEvent(event: any): Promise<void> {
  const work = workFromEvent(event);
  if (!work?.id) {
    return;
  }

  if (work.type && work.type !== 'ticket') {
    return;
  }

  if (!looksLikePasswordResetRequest(work.title, work.body)) {
    return;
  }

  const identity = identityFromWork(work);
  if (!identity.email && !identity.userId && !identity.username) {
    await postComment(
      event,
      work.id,
      `This ticket looks like a password or lockout request.\n\n${usageHint()}`
    );
    return;
  }

  try {
    const client = new KeycloakClient(resolveConfig(event));
    const status = await client.getAccountStatus(identity);
    await postComment(
      event,
      work.id,
      `${formatAccountStatus(status)}\n\nI have not changed the account yet. Use a command to continue:\n${usageHint()}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error talking to Keycloak';
    const label = identity.email || identity.username || identity.userId;
    await postComment(
      event,
      work.id,
      `Looked up Keycloak for ${label} but could not finish the check: ${message}\n\n${usageHint()}`,
      'internal'
    );
  }
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
