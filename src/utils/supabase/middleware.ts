import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Shape returned by `createClient`. `response` is the latest `NextResponse`
 * that Supabase SSR has mutated with refreshed cookies; `clearAuthCookies`
 * expires every `sb-*` cookie on that response so a stale / invalidated
 * refresh token doesn't get re-sent on the next request.
 */
export const createClient = (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const clearAuthCookies = () => {
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith('sb-')) {
        supabaseResponse.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
      }
    }
  };

  return {
    supabase,
    get supabaseResponse() {
      return supabaseResponse;
    },
    clearAuthCookies,
  };
};

/**
 * Auth error codes that mean the stored refresh token is no longer usable
 * (user signed out elsewhere, project rotated keys, cookies survived a
 * Supabase project swap in dev, etc.). When we see one of these we should
 * treat the caller as anonymous AND clear the stale cookies so the error
 * doesn't repeat on every subsequent request.
 */
const INVALID_REFRESH_CODES = new Set([
  'refresh_token_not_found',
  'refresh_token_already_used',
  'invalid_refresh_token',
]);

export function isInvalidRefreshTokenError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { code?: unknown; message?: unknown; status?: unknown };
  if (typeof anyErr.code === 'string' && INVALID_REFRESH_CODES.has(anyErr.code)) return true;
  if (typeof anyErr.message === 'string' && /Invalid Refresh Token|Refresh Token Not Found/i.test(anyErr.message)) {
    return true;
  }
  return false;
}
