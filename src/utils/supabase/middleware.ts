import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { PATHNAME_HEADER } from '@/i18n/route-namespaces';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Snapshot the request headers plus the pathname, so `src/i18n/request.ts` can
 * load only the message namespaces this route needs (see `route-namespaces.ts`).
 *
 * Must be called *after* any `request.cookies.set()`, because that mutates the
 * request's `cookie` header — snapshotting earlier would drop a token rotation
 * on its way to the render pass.
 */
const buildRequestHeaders = (request: NextRequest) => {
  const headers = new Headers(request.headers);
  headers.set(PATHNAME_HEADER, request.nextUrl.pathname);
  return headers;
};

/**
 * Shape returned by `createClient`. `response` is the latest `NextResponse`
 * that Supabase SSR has mutated with refreshed cookies; `clearAuthCookies`
 * expires every `sb-*` cookie on that response so a stale / invalidated
 * refresh token doesn't get re-sent on the next request.
 */
export const createClient = (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: buildRequestHeaders(request),
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request: { headers: buildRequestHeaders(request) } });
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
 * Build a redirect that carries forward any refreshed `sb-*` cookies Supabase
 * SSR wrote onto the session response during `getUser()`. A bare
 * `NextResponse.redirect()` returns a fresh response with no Set-Cookie
 * headers, so a token rotation that happened on this request would be dropped
 * and never reach the browser — the classic Supabase-middleware footgun. Use
 * this for every redirect in the proxy instead of `NextResponse.redirect`.
 */
export const redirectWithCookies = (
  url: URL,
  client: ReturnType<typeof createClient>,
): NextResponse => {
  const response = NextResponse.redirect(url);
  for (const cookie of client.supabaseResponse.cookies.getAll()) {
    response.cookies.set(cookie);
  }
  return response;
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

/**
 * "Auth session missing!" is what Supabase returns when getUser() is called
 * without any auth cookies — i.e. an anonymous request, which is the normal
 * case for `/`, `/login`, `/signup`, etc. It is NOT an error condition; the
 * proxy should treat it as "no user" and stop logging it.
 */
export function isAnonymousSessionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { message?: unknown };
  return (
    typeof anyErr.message === 'string' &&
    /Auth session missing/i.test(anyErr.message)
  );
}
