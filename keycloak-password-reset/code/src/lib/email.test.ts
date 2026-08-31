import { extractEmail, looksLikePasswordResetRequest, parseCommandParameters } from './email';

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
      temp: true,
    });
  });

  it('treats a bare email as a reset without temp', () => {
    expect(parseCommandParameters('  demo.user@example.com  ')).toEqual({
      email: 'demo.user@example.com',
      temp: false,
    });
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
