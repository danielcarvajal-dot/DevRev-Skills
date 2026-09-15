import axios from 'axios';

export type DevrevNotifyContext = {
  endpoint?: string;
  token?: string;
};

export const OTP_MAIL_TICKET = 'don:core:dvrv-us-1:devo/1ItqaCEzOO:ticket/23';
export const OTP_MAIL_INBOX = 'carvajaldae@gmail.com';
export const RECOVERY_TICKET_PART = 'don:core:dvrv-us-1:devo/1ItqaCEzOO:product/1';
export const RECOVERY_TICKET_OWNER = 'don:identity:dvrv-us-1:devo/1ItqaCEzOO:devu/1';
export const RECOVERY_TICKET_APP_BASE = 'https://app.devrev.ai/dcm-test/works';

export type RecoveryTicket = {
  ticketId: string;
  ticketUrl: string;
  ticketDon: string;
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

export async function sendOtpViaTicketComment(
  context: Required<DevrevNotifyContext>,
  otp: string
): Promise<void> {
  const endpoint = context.endpoint.replace(/\/$/, '');
  await axios.post(
    `${endpoint}/internal/timeline-entries.create`,
    {
      type: 'timeline_comment',
      object: OTP_MAIL_TICKET,
      visibility: 'external',
      body: [
        `Your Keycloak unlock verification code is ${otp}.`,
        'It expires in 10 minutes.',
        `This was sent to ${OTP_MAIL_INBOX} because Computer cannot Notify the same DevRev account that opened the chat.`,
        'Paste the code in Computer chat to finish unlocking.',
      ].join(' '),
    },
    {
      headers: {
        Authorization: context.token,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );
}

export async function createRecoveryTicket(
  context: Required<DevrevNotifyContext>,
  input: { action: string; identity: string; summary: string }
): Promise<RecoveryTicket> {
  const endpoint = context.endpoint.replace(/\/$/, '');
  const title = `Keycloak ${input.action} complete: ${input.identity}`;
  const response = await axios.post<{ work?: { display_id?: string; id?: string } }>(
    `${endpoint}/internal/works.create`,
    {
      type: 'ticket',
      title,
      applies_to_part: RECOVERY_TICKET_PART,
      owned_by: [RECOVERY_TICKET_OWNER],
      body: `${input.summary} Identity: ${input.identity}. Open this ticket for the audit trail.`,
    },
    {
      headers: {
        Authorization: context.token,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );
  const work = response.data.work;
  if (!work?.display_id || !work.id) {
    throw new Error('DevRev did not return a ticket id after create');
  }
  return {
    ticketId: work.display_id,
    ticketUrl: `${RECOVERY_TICKET_APP_BASE}/${work.display_id}`,
    ticketDon: work.id,
  };
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
