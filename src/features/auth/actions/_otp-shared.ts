import 'server-only';

import { randomInt, createHash } from 'crypto';
import { headers } from 'next/headers';
import { getServiceClient } from '@/utils/supabase/server';

export const OTP_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;

export type OtpPurpose = 'signup' | 'password_reset';

/**
 * Burn one OTP guess atomically and report whether the caller is now locked out.
 *
 * The counter lives in `public.otp_attempts` and is incremented by a single
 * `insert … on conflict do update … returning` statement, so concurrent
 * requests each observe a distinct value. The previous scheme read `attempts`
 * out of `app_metadata` at the top of the action and wrote back `attempts + 1`
 * at the bottom: every in-flight request read the same stale number and wrote
 * the same one back, so a batch of thousands of parallel guesses cost a single
 * increment and the 5-attempt cap did not bound a 6-digit code at all.
 *
 * Call this BEFORE comparing the submitted code.
 *
 * Fail closed if the atomic counter is unavailable: metadata read/modify/write
 * cannot bound concurrent guesses. A missing local SQL definition requires
 * schema verification before deployment, never a non-atomic fallback.
 */
export async function consumeOtpAttempt(
  userId: string,
  purpose: OtpPurpose,
): Promise<{ available: true; lockedOut: boolean }> {
  const admin = getServiceClient();
  const { data, error } = await admin.rpc('consume_otp_attempt', {
    p_user_id: userId,
    p_purpose: purpose,
  });
  if (error || !Number.isInteger(data) || (data as number) < 1) {
    console.error('[auth] otp_counter_unavailable');
    throw new Error('OTP verification temporarily unavailable');
  }
  return { available: true, lockedOut: (data as number) > MAX_ATTEMPTS };
}

/** Clear the counter when a fresh code is issued or one is redeemed. */
export async function resetOtpAttempts(userId: string, purpose: OtpPurpose): Promise<void> {
  const admin = getServiceClient();
  const { error } = await admin.rpc('reset_otp_attempts', {
    p_user_id: userId,
    p_purpose: purpose,
  });
  if (error) console.error('[auth] otp_counter_reset_failed');
}

export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function otpExpiresAt(): string {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
}

export async function getRemoteIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  );
}

const LIST_USERS_PER_PAGE = 1000;
const LIST_USERS_MAX_PAGES = 50;

export async function findUserByEmail(email: string) {
  const admin = getServiceClient();
  const target = email.toLowerCase();

  for (let page = 1; page <= LIST_USERS_MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: LIST_USERS_PER_PAGE,
    });
    if (error) {
      console.error('[auth] user_lookup_failed');
      return null;
    }
    const match = data.users.find((u) => (u.email ?? '').toLowerCase() === target);
    if (match) return match;
    if (data.users.length < LIST_USERS_PER_PAGE) return null;
  }
  return null;
}
