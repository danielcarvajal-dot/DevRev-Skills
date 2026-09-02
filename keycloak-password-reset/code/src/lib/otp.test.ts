import { codesEqual, generateOtp, maskEmail, readAttribute, userWritePayload } from './otp';

describe('otp helpers', () => {
  it('generates a 6-digit code', () => {
    expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  it('masks an email for Computer output', () => {
    expect(maskEmail('daniel.carvajal@devrev.com')).toBe('d***@devrev.com');
  });

  it('compares codes without leaking length mismatches', () => {
    expect(codesEqual('123456', '123456')).toBe(true);
    expect(codesEqual('123456', '654321')).toBe(false);
    expect(codesEqual('12345', '123456')).toBe(false);
  });

  it('reads Keycloak attributes from arrays or strings', () => {
    expect(readAttribute({ devrevUnlockOtp: ['482193'] }, 'devrevUnlockOtp')).toBe('482193');
    expect(readAttribute({ devrevUnlockOtp: '482193' }, 'devrevUnlockOtp')).toBe('482193');
  });

  it('keeps identity fields when writing attributes', () => {
    expect(
      userWritePayload(
        {
          username: 'demo.user',
          email: 'demo.user@example.com',
          enabled: true,
          firstName: 'Demo',
          lastName: 'User',
        },
        { devrevUnlockOtp: ['482193'] }
      )
    ).toEqual({
      username: 'demo.user',
      email: 'demo.user@example.com',
      enabled: true,
      emailVerified: undefined,
      firstName: 'Demo',
      lastName: 'User',
      attributes: { devrevUnlockOtp: ['482193'] },
    });
  });
});
