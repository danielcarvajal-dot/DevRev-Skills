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
      temp: false,
    });
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
      temp: false,
    });
  });
});

describe('parseAction', () => {
  it('normalizes skill names', () => {
    expect(parseAction('check_account')).toBe('check');
    expect(parseAction('UnlockAccount')).toBe('unlock');
    expect(parseAction('reset_password')).toBe('reset');
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

  it('returns a structured error without throwing', () => {
    const response = formatAgentResponse({
      action: 'check',
      error: 'No Keycloak user found for missing@example.com.',
    });
    expect(response.ok).toBe(false);
    expect(response.error).toContain('missing@example.com');
  });
});
