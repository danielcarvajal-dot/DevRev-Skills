import { inferAction } from './command';

describe('inferAction', () => {
  it('detects unlock and check from the command id', () => {
    expect(
      inferAction({
        payload: { command_id: 'don:integration:x:namespace/keycloak:command/unlock-account' },
      })
    ).toBe('unlock');
    expect(
      inferAction({
        payload: { command_id: 'don:integration:x:namespace/keycloak:command/check-account' },
      })
    ).toBe('check');
    expect(
      inferAction({
        payload: { command_id: 'don:integration:x:namespace/keycloak:command/reset-password' },
      })
    ).toBe('reset');
  });
});
