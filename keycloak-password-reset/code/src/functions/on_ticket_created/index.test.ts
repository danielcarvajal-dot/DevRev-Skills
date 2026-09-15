import { handleEvent } from './index';

const postComment = jest.fn();
const getAccountStatus = jest.fn();

jest.mock('../../lib/comments', () => {
  const actual = jest.requireActual('../../lib/comments');
  return {
    ...actual,
    postComment: (...args: unknown[]) => postComment(...args),
  };
});

jest.mock('../../lib/keycloak', () => ({
  KeycloakClient: jest.fn().mockImplementation(() => ({
    getAccountStatus: (...args: unknown[]) => getAccountStatus(...args),
  })),
}));

const event = {
  payload: {
    type: 'work_created',
    work_created: {
      work: {
        id: 'don:core:dvrv-us-1:devo/0:ticket/12',
        type: 'ticket',
        title: 'Forgot password / locked out',
        body: 'Please reset demo.user@example.com',
      },
    },
  },
  context: { secrets: { service_account_token: 'TEST-TOKEN' } },
  execution_metadata: { devrev_endpoint: 'https://api.devrev.ai', function_name: 'on_ticket_created' },
  input_data: {
    global_values: { keycloak_url: 'http://localhost:8080/', realm: 'account-unlock', client_id: 'unlock-agent' },
    keyrings: { keycloak: 'unlock-agent-demo-secret' },
  },
};

describe('on_ticket_created', () => {
  beforeEach(() => {
    postComment.mockReset();
    getAccountStatus.mockReset();
  });

  it('comments Keycloak status for a password-reset ticket', async () => {
    getAccountStatus.mockResolvedValue({
      user: { id: 'user-1', email: 'demo.user@example.com', username: 'demo.user', enabled: true },
      lockout: { disabled: true, numFailures: 6 },
    });

    await handleEvent(event);

    expect(getAccountStatus).toHaveBeenCalledWith({
      email: 'demo.user@example.com',
      userId: undefined,
      username: undefined,
    });
    expect(postComment).toHaveBeenCalledWith(
      event,
      'don:core:dvrv-us-1:devo/0:ticket/12',
      expect.stringContaining('I have not changed the account yet')
    );
  });

  it('ignores unrelated tickets', async () => {
    await handleEvent({
      ...event,
      payload: {
        type: 'work_created',
        work_created: {
          work: {
            id: 'don:core:dvrv-us-1:devo/0:ticket/99',
            type: 'ticket',
            title: 'Need a refund',
            body: 'Charge was duplicated',
          },
        },
      },
    });

    expect(getAccountStatus).not.toHaveBeenCalled();
    expect(postComment).not.toHaveBeenCalled();
  });
});
