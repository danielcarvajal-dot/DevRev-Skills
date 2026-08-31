import { inferAction } from './command';

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
