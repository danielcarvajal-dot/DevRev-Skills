import { formatAgentResponse, parseAction, parseAgentRequest } from './agent';

describe('parseAgentRequest', () => {
  it('reads structured Computer / skill fields', () => {
    expect(
      parseAgentRequest({
        payload: {
          email: 'testuser@yourcompany.com',
          action: 'check',
        },
      })
    ).toEqual({
      action: 'check',
      email: 'testuser@yourcompany.com',
      userId: undefined,
      username: undefined,
      otp: undefined,
      temp: false,
    });
  });

  it('accepts a command-style parameters string', () => {
    expect(
      parseAgentRequest({
        payload: {
          parameters: 'reset my password for demo.user@example.com --temp',
        },
      })
    ).toEqual({
      action: 'reset',
      email: 'demo.user@example.com',
      userId: undefined,
      username: undefined,
      otp: undefined,
      temp: true,
    });
  });

  it('extracts a username from free text', () => {
    expect(
      parseAgentRequest({
        payload: {
          parameters: 'unlock danielcarvajal',
        },
      })
    ).toEqual({
      action: 'unlock',
      email: undefined,
      userId: undefined,
      username: 'danielcarvajal',
      otp: undefined,
      temp: false,
    });
  });

  it('reads an OTP from structured fields or free text', () => {
    expect(
      parseAgentRequest({
        payload: {
          email: 'demo.user@example.com',
          action: 'unlock',
          otp: '482193',
        },
      })
    ).toEqual({
      action: 'unlock',
      email: 'demo.user@example.com',
      userId: undefined,
      username: undefined,
      otp: '482193',
      temp: false,
    });
    expect(parseAgentRequest({ payload: { parameters: 'unlock danielcarvajal 482193' } }).otp).toBe('482193');
  });

  it('accepts a Keycloak username', () => {
    expect(
      parseAgentRequest({
        payload: {
          username: 'danielcarvajal',
          action: 'unlock',
        },
      })
    ).toEqual({
      action: 'unlock',
      email: undefined,
      userId: undefined,
      username: 'danielcarvajal',
      otp: undefined,
      temp: false,
    });
  });

  it('looks up a Keycloak user id', () => {
    expect(
      parseAgentRequest({
        payload: {
          user_id: 'd6f8d294-805c-492c-a401-c3192af545bf',
          action: 'unlock',
        },
      })
    ).toEqual({
      action: 'unlock',
      email: undefined,
      userId: 'd6f8d294-805c-492c-a401-c3192af545bf',
      username: undefined,
      otp: undefined,
      temp: false,
    });
  });
});

describe('parseAction', () => {
  it('normalizes skill names', () => {
    expect(parseAction('check_account')).toBe('check');
    expect(parseAction('UnlockAccount')).toBe('unlock');
    expect(parseAction('reset_password')).toBe('reset');
    expect(parseAction('send_otp')).toBe('send_otp');
    expect(parseAction('KeycloakSendUnlockOtp')).toBe('send_otp');
  });
});

describe('formatAgentResponse', () => {
  it('summarizes a successful reset email', () => {
    const response = formatAgentResponse({
      action: 'reset',
      result: {
        action: 'reset',
        email: 'demo.user@example.com',
        user: { id: 'user-1', email: 'demo.user@example.com', username: 'demo.user', enabled: true },
        lockout: { disabled: true, numFailures: 4 },
        wasLocked: true,
        wasDisabled: false,
        unlocked: true,
        enabled: true,
        resetEmailSent: true,
      },
    });

    expect(response.ok).toBe(true);
    expect(response.reset_email_sent).toBe(true);
    expect(response.message).toContain('password-reset email');
    expect(response.account?.locked).toBe(true);
  });

  it('tells Computer that a permanent lockout is recoverable', () => {
    const response = formatAgentResponse({
      action: 'check',
      status: {
        user: { id: 'user-1', email: 'demo.user@example.com', username: 'demo.user', enabled: false },
        lockout: { disabled: false, numFailures: 0 },
      },
    });
    expect(response.message).toMatch(/permanent lockout/i);
    expect(response.message).toMatch(/re-enable/i);
    expect(response.account?.enabled).toBe(false);
  });

  it('tells Computer that Daniel codes go to Gmail', () => {
    const response = formatAgentResponse({
      action: 'send_otp',
      result: {
        action: 'send_otp',
        email: 'daniel.carvajal@devrev.ai',
        user: {
          id: 'user-daniel',
          email: 'daniel.carvajal@devrev.ai',
          username: 'danielcarvajal',
          enabled: false,
        },
        lockout: {},
        wasLocked: false,
        wasDisabled: true,
        unlocked: false,
        enabled: false,
        resetEmailSent: false,
        otpSent: true,
        otpDestination: 'c***@gmail.com',
      },
    });
    expect(response.ok).toBe(true);
    expect(response.otp_destination).toBe('c***@gmail.com');
    expect(response.message).toContain('carvajaldae@gmail.com');
  });

  it('returns a structured error without throwing', () => {
    const response = formatAgentResponse({
      action: 'check',
      error: 'No Keycloak user found for missing@example.com.',
    });
    expect(response.ok).toBe(false);
    expect(response.error).toContain('missing@example.com');
  });
});
