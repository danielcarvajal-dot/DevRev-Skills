const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{2,64}$/;

export function extractEmail(text: string | undefined | null): string | undefined {
  if (!text) {
    return undefined;
  }
  const match = text.match(EMAIL_PATTERN);
  return match?.[0];
}

export function extractUserId(text: string | undefined | null): string | undefined {
  if (!text) {
    return undefined;
  }
  const match = text.match(UUID_PATTERN);
  return match?.[0];
}

const USERNAME_RESERVED = new Set([
  'a',
  'account',
  'am',
  'an',
  'and',
  'check',
  'code',
  'email',
  'for',
  'forgot',
  'help',
  'i',
  "i'm",
  'is',
  'keycloak',
  'locked',
  'lockout',
  'me',
  'my',
  'of',
  'or',
  'otp',
  'out',
  'passcode',
  'passwd',
  'password',
  'please',
  'reset',
  'status',
  'temp',
  'the',
  'to',
  'unlock',
  'user',
  'username',
  'validate',
  'verification',
  'verify',
]);

export function extractUsername(text: string | undefined | null): string | undefined {
  if (!text) {
    return undefined;
  }
  for (const token of text.trim().split(/\s+/)) {
    if (!token || token.includes('@') || UUID_PATTERN.test(token) || token.startsWith('--') || /^\d{6}$/.test(token)) {
      continue;
    }
    if (USERNAME_RESERVED.has(token.toLowerCase())) {
      continue;
    }
    if (USERNAME_PATTERN.test(token)) {
      return token;
    }
  }
  return undefined;
}

export function emailAliases(email: string): string[] {
  const trimmed = email.trim();
  const aliases = [trimmed];
  if (/@devrev\.ai$/i.test(trimmed)) {
    aliases.push(trimmed.replace(/@devrev\.ai$/i, '@devrev.com'));
  }
  if (/@devrev\.com$/i.test(trimmed)) {
    aliases.push(trimmed.replace(/@devrev\.com$/i, '@devrev.ai'));
  }
  return [...new Set(aliases)];
}

export function usernameAliases(username: string): string[] {
  const trimmed = username.trim();
  const compact = trimmed.replace(/[-_.]/g, '');
  return compact && compact.toLowerCase() !== trimmed.toLowerCase() ? [trimmed, compact] : [trimmed];
}

export function extractOtp(text: string | undefined | null): string | undefined {
  if (!text) {
    return undefined;
  }
  const match = text.match(/\b(\d{6})\b/);
  return match?.[1];
}

export function parseCommandParameters(params: string | undefined | null): {
  email?: string;
  userId?: string;
  username?: string;
  otp?: string;
  temp: boolean;
} {
  const raw = (params ?? '').trim();
  const temp = /(?:^|\s)--temp(?:\s|$)/i.test(raw);
  const withoutFlags = raw.replace(/--temp/gi, ' ').replace(/\s+/g, ' ').trim();
  return {
    email: extractEmail(withoutFlags),
    userId: extractUserId(withoutFlags),
    username: extractUsername(withoutFlags),
    otp: extractOtp(withoutFlags),
    temp,
  };
}

const PASSWORD_INTENT =
  /\b(password|passwd|passcode|locked\s*out|lockout|brute[- ]?force|forgot|unlock|reset\s+(my\s+)?(password|account)|can'?t\s+(log|sign)\s*in)\b/i;

export function looksLikePasswordResetRequest(title: string | undefined, body: string | undefined): boolean {
  return PASSWORD_INTENT.test(`${title ?? ''} ${body ?? ''}`);
}

export function generateTemporaryPassword(length = 16): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';
  const all = upper + lower + digits + symbols;

  const required = [
    upper[randomIndex(upper.length)],
    lower[randomIndex(lower.length)],
    digits[randomIndex(digits.length)],
    symbols[randomIndex(symbols.length)],
  ];

  const rest = Array.from({ length: Math.max(0, length - required.length) }, () => all[randomIndex(all.length)]);
  return shuffle([...required, ...rest]).join('');
}

function randomIndex(max: number): number {
  return Math.floor(Math.random() * max);
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
