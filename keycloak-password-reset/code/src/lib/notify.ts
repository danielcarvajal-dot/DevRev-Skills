import axios from 'axios';

export type DevrevNotifyContext = {
  endpoint?: string;
  token?: string;
};

type DevrevUser = {
  id?: string;
  email?: string;
};

export async function sendDevrevOtpNotification(
  context: Required<DevrevNotifyContext>,
  to: string,
  otp: string
): Promise<void> {
  const endpoint = context.endpoint.replace(/\/$/, '');
  const headers = {
    Authorization: context.token,
    'Content-Type': 'application/json',
  };

  const listed = await axios.post<{ dev_users?: DevrevUser[] }>(
    `${endpoint}/internal/dev-users.list`,
    { email: [to] },
    { headers, timeout: 15000 }
  );
  const receiver = (listed.data.dev_users || []).find((user) => user.email?.toLowerCase() === to.toLowerCase());
  if (!receiver?.id) {
    throw new Error(`No DevRev user found for ${to}, so the unlock code cannot be emailed`);
  }

  await axios.post(
    `${endpoint}/internal/notifications.send`,
    {
      notifications: [
        {
          type: 'generic_notification',
          receiver: receiver.id,
          event_type: 'alert',
          metadata: [
            {
              content_template: 'don:core:dvrv-us-1:devo/1ItqaCEzOO:notification_content_template/2',
              title: 'Your Keycloak unlock code',
              body: `Your Keycloak unlock verification code is ${otp}. It expires in 10 minutes. Paste it in Computer chat to finish unlocking.`,
            },
          ],
        },
      ],
    },
    { headers, timeout: 15000 }
  );
}

export function notifyContextFromEvent(event: {
  context?: { secrets?: { service_account_token?: string } };
  execution_metadata?: { devrev_endpoint?: string };
}): DevrevNotifyContext {
  return {
    endpoint: event.execution_metadata?.devrev_endpoint,
    token: event.context?.secrets?.service_account_token,
  };
}
