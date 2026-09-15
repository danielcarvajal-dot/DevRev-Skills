import { handleEvent } from './index';

const postComment = jest.fn();
const recoverAccount = jest.fn();
const getAccountStatus = jest.fn();
const sendUnlockOtp = jest.fn();
const verifyAndRecover = jest.fn();

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
    sendUnlockOtp: (...args: unknown[]) => sendUnlockOtp(...args),
    verifyAndRecover: (...args: unknown[]) => verifyAndRecover(...args),
  })),
}));

const baseEvent = {
  payload: {
    command_id: 'don:integration:dvrv-us-1:devo/x:namespace/keycloak:command/reset_password',
    parameters: 'demo.user@example.com 482193',
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
    sendUnlockOtp.mockReset();
    verifyAndRecover.mockReset();
  });

  it('resets a password and comments the result', async () => {
    verifyAndRecover.mockResolvedValue({
      action: 'reset',
      email: 'demo.user@example.com',
      user: { id: 'user-1', email: 'demo.user@example.com', username: 'demo.user', enabled: true },
      lockout: { disabled: true, numFailures: 4 },
      wasLocked: true,
      wasDisabled: false,
      unlocked: true,
      enabled: true,
      resetEmailSent: true,
      otpVerified: true,
    });

    await handleEvent(baseEvent);

    expect(verifyAndRecover).toHaveBeenCalledWith(
      { email: 'demo.user@example.com', userId: undefined, username: undefined },
      '482193',
      {
        action: 'reset',
        sendResetEmail: true,
        setTempPassword: false,
      }
    );
    expect(postComment).toHaveBeenCalledWith(
      baseEvent,
      'don:core:dvrv-us-1:devo/x:ticket/18',
      expect.stringContaining('password-reset email'),
      'external'
    );
  });

  it('posts a temporary password as an internal comment', async () => {
    verifyAndRecover.mockResolvedValue({
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
      otpVerified: true,
    });

    await handleEvent({
      ...baseEvent,
      payload: { ...baseEvent.payload, parameters: 'demo.user@example.com 482193 --temp' },
    });

    expect(verifyAndRecover).toHaveBeenCalledWith(
      { email: 'demo.user@example.com', userId: undefined, username: undefined },
      '482193',
      {
        action: 'reset',
        sendResetEmail: false,
        setTempPassword: true,
      }
    );
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
        command_id: 'don:integration:dvrv-us-1:devo/x:namespace/keycloak:command/check_account',
      },
    });

    expect(getAccountStatus).toHaveBeenCalledWith({
      email: 'demo.user@example.com',
      userId: undefined,
      username: undefined,
    });
    expect(recoverAccount).not.toHaveBeenCalled();
    expect(postComment).toHaveBeenCalledWith(
      expect.any(Object),
      baseEvent.payload.source_id,
      expect.stringContaining('Brute-force locked: no')
    );
  });

  it('looks up a Keycloak user by id', async () => {
    verifyAndRecover.mockResolvedValue({
      action: 'reset',
      email: 'demo.user@example.com',
      user: { id: 'd6f8d294-805c-492c-a401-c3192af545bf', email: 'demo.user@example.com', enabled: true },
      lockout: { disabled: false },
      wasLocked: false,
      wasDisabled: false,
      unlocked: false,
      enabled: true,
      resetEmailSent: true,
      otpVerified: true,
    });

    await handleEvent({
      ...baseEvent,
      payload: { ...baseEvent.payload, parameters: 'd6f8d294-805c-492c-a401-c3192af545bf 482193' },
    });

    expect(verifyAndRecover).toHaveBeenCalledWith(
      { email: undefined, userId: 'd6f8d294-805c-492c-a401-c3192af545bf', username: undefined },
      '482193',
      expect.objectContaining({ action: 'reset' })
    );
  });

  it('looks up a Keycloak user by username', async () => {
    verifyAndRecover.mockResolvedValue({
      action: 'unlock',
      email: 'danielcarvajal',
      user: { id: 'user-daniel', email: 'daniel.carvajal@devrev.com', username: 'danielcarvajal', enabled: true },
      lockout: { disabled: true },
      wasLocked: true,
      wasDisabled: false,
      unlocked: true,
      enabled: true,
      resetEmailSent: false,
      otpVerified: true,
    });

    await handleEvent({
      ...baseEvent,
      payload: {
        ...baseEvent.payload,
        command_id: 'don:integration:dvrv-us-1:devo/x:namespace/keycloak:command/unlock_account',
        parameters: 'danielcarvajal 482193',
      },
    });

    expect(verifyAndRecover).toHaveBeenCalledWith(
      { email: undefined, userId: undefined, username: 'danielcarvajal' },
      '482193',
      expect.objectContaining({ action: 'unlock' })
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
