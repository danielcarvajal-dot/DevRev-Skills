const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

export function extractEmail(text: string | undefined | null): string | undefined {
  if (!text) {
    return undefined;
  }
  const match = text.match(EMAIL_PATTERN);
  return match?.[0];
}

const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

export function extractUserId(text: string | undefined | null): string | undefined {
  if (!text) {
    return undefined;
  }
  const match = text.match(UUID_PATTERN);
  return match?.[0];
}

export function parseCommandParameters(params: string | undefined | null): {
  email?: string;
  userId?: string;
  temp: boolean;
} {
  const raw = (params ?? '').trim();
  const temp = /(?:^|\s)--temp(?:\s|$)/i.test(raw);
  const withoutFlags = raw.replace(/--temp/gi, ' ').replace(/\s+/g, ' ').trim();
  return {
    email: extractEmail(withoutFlags),
    userId: extractUserId(withoutFlags),
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
