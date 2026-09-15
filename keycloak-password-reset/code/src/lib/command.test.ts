import { identityFromWork, inferAction } from './command';

describe('inferAction', () => {
  it('detects unlock and check from the command id', () => {
    expect(
      inferAction({
        payload: { command_id: 'don:integration:x:namespace/keycloak:command/unlock_account' },
      })
    ).toBe('unlock');
    expect(
      inferAction({
        payload: { command_id: 'don:integration:x:namespace/keycloak:command/check_account' },
      })
    ).toBe('check');
    expect(
      inferAction({
        payload: { command_id: 'don:integration:x:namespace/keycloak:command/reset_password' },
      })
    ).toBe('reset');
  });
});

describe('identityFromWork', () => {
  it('reads a username from the ticket title', () => {
    expect(identityFromWork({ title: 'Unlock danielcarvajal', body: 'I am locked out' })).toEqual({
      email: undefined,
      userId: undefined,
      username: 'danielcarvajal',
    });
  });

  it('prefers an email in the body, then the reporter', () => {
    expect(
      identityFromWork({
        title: 'Forgot password',
        body: 'Please reset demo.user@example.com',
        reported_by: [{ email: 'daniel.carvajal@devrev.ai' }],
      })
    ).toEqual({
      email: 'demo.user@example.com',
      userId: undefined,
      username: undefined,
    });
  });
});
