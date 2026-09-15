import axios from 'axios';

import { AgentResponse, formatAgentResponse, parseAgentRequest } from '../../lib/agent';
import { requireLookup } from '../../lib/command';
import { resolveConfig } from '../../lib/config';
import { KeycloakClient } from '../../lib/keycloak';
import { createRecoveryTicket, notifyContextFromEvent } from '../../lib/notify';
import { deliverUnlockOtp } from '../../lib/otp';
import { RecoveryAction } from '../../lib/types';

export async function handleEvent(event: any): Promise<AgentResponse> {
  const request = parseAgentRequest(event);
  const action: RecoveryAction = request.action;

  try {
    const identity = requireLookup({
      email: request.email,
      userId: request.userId,
      username: request.username,
    });
    const client = new KeycloakClient(resolveConfig(event), axios, (to, otp) =>
      deliverUnlockOtp(to, otp, notifyContextFromEvent(event))
    );

    if (action === 'check') {
      const status = await client.getAccountStatus(identity);
      return formatAgentResponse({ action, status });
    }

    if (action === 'send_otp') {
      const result = await client.sendUnlockOtp(identity);
      return formatAgentResponse({ action, result });
    }

    if (!request.otp) {
      return formatAgentResponse({
        action,
        error:
          'Send a 6-digit OTP to the account email first (KeycloakSendUnlockOtp). Then call unlock or reset with that code. Do not invent a code.',
      });
    }

    const result = await client.verifyAndRecover(identity, request.otp, {
      action,
      sendResetEmail: action === 'reset' && !request.temp,
      setTempPassword: action === 'reset' && request.temp,
    });

    const notify = notifyContextFromEvent(event);
    if (notify.endpoint && notify.token) {
      try {
        const ticket = await createRecoveryTicket(
          { endpoint: notify.endpoint, token: notify.token },
          {
            action,
            identity: identity.email || identity.username || identity.userId || result.email,
            summary:
              action === 'unlock'
                ? 'Computer finished a Keycloak account unlock.'
                : 'Computer finished a Keycloak password reset.',
          }
        );
        result.ticketId = ticket.ticketId;
        result.ticketUrl = ticket.ticketUrl;
      } catch (ticketError) {
        result.ticketError = ticketError instanceof Error ? ticketError.message : 'Could not create the follow-up ticket';
      }
    }

    return formatAgentResponse({ action, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error talking to Keycloak';
    return formatAgentResponse({ action, error: message });
  }
}

export const run = async (events: any[]): Promise<AgentResponse | AgentResponse[]> => {
  const results: AgentResponse[] = [];
  for (const event of events) {
    results.push(await handleEvent(event));
  }
  return results.length === 1 ? results[0] : results;
};

export default run;
