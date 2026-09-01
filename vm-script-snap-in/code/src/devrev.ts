/*
 * Small DevRev HTTP helpers. Snap-kit bodies are easier via REST than the SDK.
 */

export interface DevRevClient {
  token: string;
  endpoint: string;
}

export function clientFromEvent(event: {
  context?: { secrets?: { service_account_token?: string } };
  execution_metadata?: { devrev_endpoint?: string };
}): DevRevClient {
  const token = event.context?.secrets?.service_account_token || '';
  const endpoint = (event.execution_metadata?.devrev_endpoint || 'https://api.devrev.ai').replace(/\/$/, '');
  return { token, endpoint };
}

export async function timelineCreate(
  client: DevRevClient,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; text: string }> {
  return post(client, '/timeline-entries.create', body);
}

export async function timelineUpdate(
  client: DevRevClient,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; text: string }> {
  return post(client, '/timeline-entries.update', body);
}

export async function postWebhook(
  url: string,
  payload: Record<string, unknown>,
  secret?: string
): Promise<{ ok: boolean; status: number; text: string }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (secret) {
    headers.authorization = `Bearer ${secret}`;
  }
  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, text };
}

async function post(
  client: DevRevClient,
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; text: string }> {
  const resp = await fetch(`${client.endpoint}${path}`, {
    method: 'POST',
    headers: {
      authorization: client.token,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  if (!resp.ok) {
    console.error(`DevRev ${path} failed`, resp.status, text);
  }
  return { ok: resp.ok, status: resp.status, text };
}
