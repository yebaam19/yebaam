import 'server-only';

import { randomInt, createHash } from 'crypto';

export const OTP_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;

export type OtpPurpose = 'signup' | 'password_reset';

export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function otpExpiresAt(): string {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
}
