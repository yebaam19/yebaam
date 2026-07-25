import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Local JWT verification instead of a GoTrue round-trip.
 *
 * This project signs access tokens with an **asymmetric ES256 (EC P-256) key**
 * — `GET $NEXT_PUBLIC_SUPABASE_URL/auth/v1/.well-known/jwks.json` returns
 * `{"alg":"ES256","kty":"EC","crv":"P-256"}`. That means `auth.getClaims()`
 * verifies the token signature with WebCrypto in-process and never asks the
 * Auth server who the user is, while `auth.getUser()` is always a network
 * round-trip. On the two hottest auth paths (the proxy, which runs on every
 * page/RSC request, and `getCachedAuthUser()`, which every RSC render hits)
 * that round-trip is pure latency.
 *
 * Three properties of `getClaims()` make this a safe swap — all verified
 * against the installed `@supabase/auth-js@2.103.0` source:
 *
 * 1. **Cookies still refresh.** With no `jwt` argument, `getClaims()` starts
 *    with `await this.getSession()` → `_useSession` → `__loadSession()`, which
 *    is the *same* code path `getUser()` uses. `__loadSession()` calls
 *    `_callRefreshToken(currentSession.refresh_token)` when the access token is
 *    within `EXPIRY_MARGIN_MS` (90 s) of expiry; that saves the new session to
 *    storage and emits `TOKEN_REFRESHED`, which is exactly the event
 *    `@supabase/ssr`'s `createServerClient` listens for to run `applyServerStorage`
 *    → our `setAll` cookie writer. No extra refresh call is needed here.
 *
 * 2. **The JWKS is cached process-wide, not per client.** `GoTrueClient`
 *    stores it in a module-scoped `GLOBAL_JWKS[storageKey]` behind a 10-minute
 *    TTL (`JWKS_TTL`), so creating a fresh cookie-bound client per request —
 *    which we must do — does not re-fetch the key set on every request.
 *
 * 3. **It degrades to `getUser()` on its own.** If the project ever moves to a
 *    symmetric (HS*) signing key, or WebCrypto is unavailable, `getClaims()`
 *    internally falls back to `getUser(token)` and only trusts the claims if
 *    that succeeds. Nothing here has to change for that to keep working.
 *
 * **Security trade-off, stated plainly:** `getUser()` asks the Auth server on
 * every call, so a user who is deleted, banned, or signed out globally is
 * rejected on their very next request. `getClaims()` trusts a
 * cryptographically valid, unexpired token, so such a user stays "signed in"
 * until their current access token expires (the project's JWT TTL — Supabase's
 * default is 1 hour). Authorization is unaffected: RLS and every role lookup
 * (`platform_admins`, `forum_global_roles`, …) still run against the live DB
 * with the user's token, so revoking a *permission* takes effect immediately.
 * Only revoking the *identity itself* is delayed by up to one token lifetime.
 * Keep flows that must observe a revocation instantly (account deletion,
 * ban enforcement, admin-only mutations) on `getUser()`.
 */

/**
 * Structural slice of the Supabase client we need. Typed this way so both the
 * proxy's `createServerClient` (edge) and `getServerClient()` (node) satisfy it
 * without dragging generic `Database` parameters through the signature.
 */
type ClaimsCapableClient = { auth: Pick<SupabaseClient['auth'], 'getClaims'> };

type GetClaimsResponse = Awaited<ReturnType<SupabaseClient['auth']['getClaims']>>;

/** `AuthError`, derived from the installed client so it can't drift. */
export type AuthClaimsError = NonNullable<GetClaimsResponse['error']>;

/**
 * The subset of a Supabase `User` that is actually present in the access token.
 *
 * Deliberately narrower than `@supabase/supabase-js`'s `User`: fields that only
 * exist on the `auth.users` row (`created_at`, `updated_at`, `identities`,
 * `email_confirmed_at`, `last_sign_in_at`, `factors`, …) are NOT JWT claims, so
 * a caller that needs one of those must stay on `getUser()`.
 */
export type AuthClaimsUser = {
  /** JWT `sub` claim — the `auth.users.id`. */
  id: string;
  email: string | null;
  phone: string | null;
  /** Postgres role the token authorizes (`authenticated`, `anon`, …). */
  role: string | null;
  /** `session_id` claim — identifies the login session, not the user. */
  sessionId: string | null;
  isAnonymous: boolean;
  appMetadata: Record<string, unknown>;
  userMetadata: Record<string, unknown>;
  /** `exp` claim, unix seconds. Useful for reasoning about revocation lag. */
  expiresAt: number | null;
};

export type AuthClaimsResult = {
  user: AuthClaimsUser | null;
  /**
   * `null` in two distinct cases: a verified user (`user` set) and a plain
   * anonymous request (`user` null). `getClaims()` returns `{ data: null,
   * error: null }` when there is no session at all — unlike `getUser()`, which
   * returns an "Auth session missing!" error for the same situation. Callers
   * must therefore NOT treat `user === null` as an error condition.
   */
  error: AuthClaimsError | null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

/**
 * Verify the caller's access token locally and map its claims onto the small
 * user shape the rest of the app reads. Does not swallow throws — the proxy
 * needs to distinguish a thrown invalid-refresh-token from a returned one.
 */
export async function getAuthClaimsUser(
  client: ClaimsCapableClient,
): Promise<AuthClaimsResult> {
  const { data, error } = await client.auth.getClaims();
  if (error) return { user: null, error };

  const claims = data?.claims;
  const id = asString(claims?.sub);
  // No session, or a token without a subject — anonymous, and not an error.
  if (!claims || !id) return { user: null, error: null };

  return {
    user: {
      id,
      email: asString(claims.email),
      phone: asString(claims.phone),
      role: asString(claims.role),
      sessionId: asString(claims.session_id),
      isAnonymous: claims.is_anonymous === true,
      appMetadata: asRecord(claims.app_metadata),
      userMetadata: asRecord(claims.user_metadata),
      expiresAt: typeof claims.exp === 'number' ? claims.exp : null,
    },
    error: null,
  };
}
