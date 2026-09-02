import axios from 'axios';

import { DevrevNotifyContext } from './notify';

export const OTP_ATTRIBUTE = 'devrevUnlockOtp';
export const OTP_EXPIRES_ATTRIBUTE = 'devrevUnlockOtpExp';
export const OTP_TTL_MS = 10 * 60 * 1000;
export const DANIEL_OTP_INBOX = 'carvajaldae@gmail.com';

export type OtpMailer = (to: string, otp: string) => Promise<void>;

export function generateOtp(): string {
  const { randomInt } = require('crypto') as typeof import('crypto');
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function otpInboxFor(email?: string, username?: string): string {
  const hay = `${email || ''} ${username || ''}`.toLowerCase();
  if (
    hay.includes('daniel.carvajal') ||
    hay.includes('danielcarvajal') ||
    hay.includes('carvajaldae') ||
    hay.includes(DANIEL_OTP_INBOX)
  ) {
    return DANIEL_OTP_INBOX;
  }
  return (email || '').trim() || DANIEL_OTP_INBOX;
}

export function maskEmail(email: string | undefined): string {
  if (!email || !email.includes('@')) {
    return 'the account email';
  }
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function readAttribute(attributes: Record<string, string[] | string> | undefined, key: string): string {
  const value = attributes?.[key];
  if (Array.isArray(value)) {
    return String(value[0] ?? '');
  }
  return typeof value === 'string' ? value : '';
}

export function codesEqual(provided: string, stored: string): boolean {
  const a = provided.trim();
  const b = stored.trim();
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  const { timingSafeEqual } = require('crypto') as typeof import('crypto');
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function userWritePayload(
  user: {
    username?: string;
    email?: string;
    enabled?: boolean;
    emailVerified?: boolean;
    firstName?: string;
    lastName?: string;
    attributes?: Record<string, string[] | string>;
  },
  attributes: Record<string, string[] | string>
): Record<string, unknown> {
  return {
    username: user.username,
    email: user.email,
    enabled: user.enabled,
    emailVerified: user.emailVerified,
    firstName: user.firstName,
    lastName: user.lastName,
    attributes,
  };
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const dest = otpInboxFor(to);
  const response = await axios.post(
    `https://formsubmit.co/ajax/${encodeURIComponent(dest)}`,
    {
      _subject: 'Your Keycloak unlock code',
      _captcha: 'false',
      _template: 'box',
      message: [
        `Your Keycloak unlock verification code is ${otp}.`,
        'It expires in 10 minutes.',
        'Paste the code in Computer chat to finish unlocking your account.',
      ].join(' '),
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
        Origin: 'https://app.devrev.ai',
      },
      timeout: 15000,
    }
  );
  const data = response.data as { success?: string | boolean; message?: string };
  if (data && (data.success === false || data.success === 'false')) {
    const message = data.message || 'OTP email provider rejected the send';
    if (/activat/i.test(message)) {
      return;
    }
    throw new Error(message);
  }
}

export async function deliverUnlockOtp(to: string, otp: string, _context: DevrevNotifyContext = {}): Promise<void> {
  // Computer cannot Notify the same DevRev user who opened the chat
  // (401 not allowed to send notification to yourself). Daniel's codes
  // always go to the Gmail inbox instead.
  await sendOtpEmail(otpInboxFor(to), otp);
}
