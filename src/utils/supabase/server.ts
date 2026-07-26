import { createServerClient } from '@supabase/ssr';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { getAuthClaimsUser } from './claims';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore if middleware refreshes sessions.
        }
      },
    },
  });
};

/**
 * Server client bound to the caller's session — use from route handlers and
 * Server Actions when you want RLS to apply with the user's identity.
 */
// Memoized per server request (React.cache): the Supabase SSR client is
// cookie-bound and stateless per request, so layout + page + actions share one
// instance instead of each calling cookies() and re-creating a client. This also
// collapses the duplicate auth.getUser() network round-trips on heavy routes (/feed).
export const getServerClient = cache(async () => {
  const cookieStore = await cookies();
  return createClient(cookieStore);
});

/**
 * Service-role client — bypasses RLS. Use ONLY from server code for
 * privileged operations (admin tasks, cron-like jobs, user-impersonation-
 * sensitive flows). Never expose this client or its key to the browser.
 */
export function getServiceClient() {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot create service client');
  }
  return createServiceRoleClient(supabaseUrl!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Return the caller's verified user id, or null when the request carries no
 * cryptographically valid session.
 *
 * This is the primitive an `/api/**` route should gate on. `src/proxy.ts`
 * deliberately excludes `/api` from its matcher, so a route handler is the
 * *only* thing standing between an anonymous request and whatever it does.
 */
export async function getVerifiedUserId(): Promise<string | null> {
  const client = await getServerClient();
  const { user } = await getAuthClaimsUser(client);
  return user?.id ?? null;
}

/**
 * Return the raw access token from the current Supabase session, or null when
 * unauthenticated. Useful for forwarding the token to downstream services that
 * will themselves verify it (e.g. PostgREST).
 *
 * **The token is verified before it is returned.** `auth.getSession()` on its
 * own hands back whatever the browser-writable `sb-<ref>-auth-token` cookie
 * decodes to: auth-js's `_isValidSession` only checks that the object *has*
 * `access_token` / `refresh_token` / `expires_at`, and `@supabase/ssr`'s server
 * storage explicitly labels the value untrusted. A hand-written cookie with a
 * far-future `expires_at` therefore used to satisfy every `if (!token) 401`
 * gate in `src/app/api/**`. That is harmless for handlers that go on to query
 * Postgres — PostgREST rejects the forged JWT — but the routes that spend
 * server-held Cloudflare / R2 credentials never touch the database, so nothing
 * downstream caught the forgery. `getAuthClaimsUser()` verifies the ES256
 * signature locally (and still refreshes the cookie — see `claims.ts`) so the
 * gate means what its callers already assumed it meant.
 */
export async function getServerAccessToken(): Promise<string | null> {
  const client = await getServerClient();
  const { user } = await getAuthClaimsUser(client);
  if (!user) return null;

  // Safe now: the cookie's signature checked out above, and `getClaims()` has
  // already loaded (and if needed refreshed) the session, so this reads from
  // the client's in-memory session rather than re-parsing the cookie.
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}
