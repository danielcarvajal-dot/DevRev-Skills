import { handleEvent } from './index';

const recoverAccount = jest.fn();
const getAccountStatus = jest.fn();

jest.mock('../../lib/keycloak', () => ({
  KeycloakClient: jest.fn().mockImplementation(() => ({
    recoverAccount: (...args: unknown[]) => recoverAccount(...args),
    getAccountStatus: (...args: unknown[]) => getAccountStatus(...args),
  })),
}));

const baseEvent = {
  payload: {
    email: 'demo.user@example.com',
    action: 'reset',
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

describe('agent_handler', () => {
  beforeEach(() => {
    recoverAccount.mockReset();
    getAccountStatus.mockReset();
  });

  it('returns JSON for a Computer password reset', async () => {
    recoverAccount.mockResolvedValue({
      action: 'reset',
      email: 'demo.user@example.com',
      user: { id: 'user-1', email: 'demo.user@example.com', username: 'demo.user', enabled: true },
      lockout: { disabled: false },
      wasLocked: false,
      wasDisabled: false,
      unlocked: false,
      enabled: true,
      resetEmailSent: true,
    });

    const response = await handleEvent(baseEvent);

    expect(recoverAccount).toHaveBeenCalledWith(
      { email: 'demo.user@example.com', userId: undefined },
      {
        action: 'reset',
        sendResetEmail: true,
        setTempPassword: false,
      }
    );
    expect(response.ok).toBe(true);
    expect(response.reset_email_sent).toBe(true);
    expect(response.account?.email).toBe('demo.user@example.com');
  });

  it('sets a temporary password when temp is true', async () => {
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

    const response = await handleEvent({
      ...baseEvent,
      payload: { email: 'demo.user@example.com', action: 'reset', temp: true },
    });

    expect(recoverAccount).toHaveBeenCalledWith(
      { email: 'demo.user@example.com', userId: undefined },
      {
        action: 'reset',
        sendResetEmail: false,
        setTempPassword: true,
      }
    );
    expect(response.temporary_password).toBe('TempPass123!');
  });

  it('checks status without mutating Keycloak', async () => {
    getAccountStatus.mockResolvedValue({
      user: { id: 'user-1', email: 'demo.user@example.com', enabled: true, username: 'demo.user' },
      lockout: { disabled: false, numFailures: 0 },
    });

    const response = await handleEvent({
      ...baseEvent,
      payload: { email: 'demo.user@example.com', action: 'check' },
    });

    expect(getAccountStatus).toHaveBeenCalled();
    expect(recoverAccount).not.toHaveBeenCalled();
    expect(response.action).toBe('check');
    expect(response.account?.locked).toBe(false);
  });

  it('returns a structured error when Keycloak is not configured', async () => {
    const response = await handleEvent({
      payload: { email: 'demo.user@example.com', action: 'check' },
      input_data: { global_values: {}, keyrings: {} },
    });

    expect(response.ok).toBe(false);
    expect(response.error).toContain('Missing Keycloak configuration');
  });
});
