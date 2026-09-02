import {
  emailAliases,
  extractEmail,
  extractUsername,
  looksLikePasswordResetRequest,
  parseCommandParameters,
  usernameAliases,
} from './email';

describe('extractEmail', () => {
  it('finds the first email in free text', () => {
    expect(extractEmail('Please help demo.user@example.com reset')).toBe('demo.user@example.com');
  });

  it('returns undefined when no email is present', () => {
    expect(extractEmail('no address here')).toBeUndefined();
  });
});

describe('parseCommandParameters', () => {
  it('parses an email and the temp flag', () => {
    expect(parseCommandParameters('demo.user@example.com --temp')).toEqual({
      email: 'demo.user@example.com',
      userId: undefined,
      username: undefined,
      otp: undefined,
      temp: true,
    });
  });

  it('treats a bare email as a reset without temp', () => {
    expect(parseCommandParameters('  demo.user@example.com  ')).toEqual({
      email: 'demo.user@example.com',
      userId: undefined,
      username: undefined,
      otp: undefined,
      temp: false,
    });
  });

  it('parses a Keycloak user id', () => {
    expect(parseCommandParameters('d6f8d294-805c-492c-a401-c3192af545bf')).toEqual({
      email: undefined,
      userId: 'd6f8d294-805c-492c-a401-c3192af545bf',
      username: undefined,
      otp: undefined,
      temp: false,
    });
  });

  it('parses a Keycloak username', () => {
    expect(parseCommandParameters('danielcarvajal')).toEqual({
      email: undefined,
      userId: undefined,
      username: 'danielcarvajal',
      otp: undefined,
      temp: false,
    });
  });

  it('parses a 6-digit OTP', () => {
    expect(parseCommandParameters('danielcarvajal 482193')).toEqual({
      email: undefined,
      userId: undefined,
      username: 'danielcarvajal',
      otp: '482193',
      temp: false,
    });
  });
});

describe('extractUsername', () => {
  it('skips command verbs and picks the Keycloak username', () => {
    expect(extractUsername('unlock danielcarvajal')).toBe('danielcarvajal');
    expect(extractUsername('check my account')).toBeUndefined();
    expect(extractUsername('unlock danielcarvajal 482193')).toBe('danielcarvajal');
  });
});

describe('emailAliases', () => {
  it('maps DevRev login domains onto the Keycloak mailbox', () => {
    expect(emailAliases('daniel.carvajal@devrev.ai')).toEqual([
      'daniel.carvajal@devrev.ai',
      'daniel.carvajal@devrev.com',
    ]);
  });
});

describe('usernameAliases', () => {
  it('strips hyphens from a DevRev display name', () => {
    expect(usernameAliases('daniel-carvajal')).toEqual(['daniel-carvajal', 'danielcarvajal']);
  });
});

describe('looksLikePasswordResetRequest', () => {
  it('matches forgotten-password tickets', () => {
    expect(looksLikePasswordResetRequest('Forgot password', 'I cannot log in')).toBe(true);
  });

  it('ignores unrelated tickets', () => {
    expect(looksLikePasswordResetRequest('Billing question', 'Need an invoice copy')).toBe(false);
  });
});
