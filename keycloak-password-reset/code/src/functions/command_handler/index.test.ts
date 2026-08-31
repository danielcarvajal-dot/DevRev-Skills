import { handleEvent } from './index';

const postComment = jest.fn();
const recoverAccount = jest.fn();
const getAccountStatus = jest.fn();

jest.mock('../../lib/comments', () => {
  const actual = jest.requireActual('../../lib/comments');
  return {
    ...actual,
    createDevRevClient: jest.fn(() => ({})),
    postComment: (...args: unknown[]) => postComment(...args),
  };
});

jest.mock('../../lib/keycloak', () => ({
  KeycloakClient: jest.fn().mockImplementation(() => ({
    recoverAccount: (...args: unknown[]) => recoverAccount(...args),
    getAccountStatus: (...args: unknown[]) => getAccountStatus(...args),
  })),
}));

const baseEvent = {
  payload: {
    command_id: 'don:integration:dvrv-us-1:devo/x:namespace/keycloak:command/reset-password',
    parameters: 'demo.user@example.com',
    source_id: 'don:core:dvrv-us-1:devo/x:ticket/18',
  },
  context: {
    secrets: { service_account_token: 'TEST-TOKEN' },
  },
  execution_metadata: {
    function_name: 'command_handler',
    devrev_endpoint: 'https://api.devrev.ai',
  },
  input_data: {
    global_values: {
      keycloak_url: 'http://localhost:8080/',
      realm: 'account-unlock',
      client_id: 'unlock-agent',
    },
    keyrings: {
      keycloak: 'unlock-agent-demo-secret',
    },
  },
};

describe('command_handler', () => {
  beforeEach(() => {
    postComment.mockReset();
    recoverAccount.mockReset();
    getAccountStatus.mockReset();
  });

  it('resets a password and comments the result', async () => {
    recoverAccount.mockResolvedValue({
      action: 'reset',
      email: 'demo.user@example.com',
      user: { id: 'user-1', email: 'demo.user@example.com', username: 'demo.user', enabled: true },
      lockout: { disabled: true, numFailures: 4 },
      wasLocked: true,
      wasDisabled: false,
      unlocked: true,
      enabled: true,
      resetEmailSent: true,
    });

    await handleEvent(baseEvent);

    expect(recoverAccount).toHaveBeenCalledWith('demo.user@example.com', {
      action: 'reset',
      sendResetEmail: true,
      setTempPassword: false,
    });
    expect(postComment).toHaveBeenCalledWith(
      baseEvent,
      'don:core:dvrv-us-1:devo/x:ticket/18',
      expect.stringContaining('password-reset email'),
      'external'
    );
  });

  it('posts a temporary password as an internal comment', async () => {
    recoverAccount.mockResolvedValue({
      action: 'reset',
      email: 'demo.user@example.com',
      user: { id: 'user-1', email: 'demo.user@example.com', enabled: true },
      lockout: { disabled: false },
      wasLocked: false,
      wasDisabled: false,
      unlocked: false,
      enabled: true,
      resetEmailSent: false,
      temporaryPassword: 'TempPass123!',
    });

    await handleEvent({
      ...baseEvent,
      payload: { ...baseEvent.payload, parameters: 'demo.user@example.com --temp' },
    });

    expect(recoverAccount).toHaveBeenCalledWith('demo.user@example.com', {
      action: 'reset',
      sendResetEmail: false,
      setTempPassword: true,
    });
    expect(postComment).toHaveBeenCalledWith(
      expect.any(Object),
      baseEvent.payload.source_id,
      expect.stringContaining('TempPass123!'),
      'internal'
    );
  });

  it('checks account status without mutating Keycloak', async () => {
    getAccountStatus.mockResolvedValue({
      user: { id: 'user-1', email: 'demo.user@example.com', enabled: true, username: 'demo.user' },
      lockout: { disabled: false, numFailures: 0 },
    });

    await handleEvent({
      ...baseEvent,
      payload: {
        ...baseEvent.payload,
        command_id: 'don:integration:dvrv-us-1:devo/x:namespace/keycloak:command/check-account',
      },
    });

    expect(getAccountStatus).toHaveBeenCalledWith('demo.user@example.com');
    expect(recoverAccount).not.toHaveBeenCalled();
    expect(postComment).toHaveBeenCalledWith(
      expect.any(Object),
      baseEvent.payload.source_id,
      expect.stringContaining('Brute-force locked: no')
    );
  });

  it('comments a helpful error when Keycloak is not configured', async () => {
    await handleEvent({
      ...baseEvent,
      input_data: { global_values: {}, keyrings: {} },
    });

    expect(postComment).toHaveBeenCalledWith(
      expect.any(Object),
      baseEvent.payload.source_id,
      expect.stringContaining('Keycloak password reset failed'),
      'internal'
    );
  });
});
