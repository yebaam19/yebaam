import 'server-only';

import { randomInt, createHash } from 'crypto';
import { headers } from 'next/headers';
import { getServiceClient } from '@/utils/supabase/server';

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
      console.error('[auth] listUsers failed:', error.message);
      return null;
    }
    const match = data.users.find((u) => (u.email ?? '').toLowerCase() === target);
    if (match) return match;
    if (data.users.length < LIST_USERS_PER_PAGE) return null;
  }
  return null;
}
