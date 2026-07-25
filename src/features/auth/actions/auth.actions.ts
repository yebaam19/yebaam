import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { getAuthClaimsUser } from '@/utils/supabase/claims';
import { withImageVariant } from '@/lib/media/urls';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  email?: string;
}

type ProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

// Caller's identity, memoized per request. Every server caller that only needs
// the user id (forum-role checks, post queries, the layout) should use THIS.
//
// Resolved from the access token's claims (`getClaims()`), which this project
// can verify locally because it uses asymmetric ES256 signing keys — no GoTrue
// round-trip, unlike `getUser()`. `cache()` still collapses the several
// per-request calls on heavy routes (/feed) into one, and the underlying
// session load keeps rotating the `sb-*` cookies exactly as before.
//
// The returned object is an `AuthClaimsUser`, NOT a full Supabase `User`: it
// carries what is actually in the JWT (`id`, `email`, `phone`, `role`,
// `sessionId`, `isAnonymous`, `appMetadata`, `userMetadata`, `expiresAt`).
// A caller that needs an `auth.users` column that is not a claim — e.g.
// `created_at`, `identities`, `email_confirmed_at`, `last_sign_in_at` — must
// call `client.auth.getUser()` directly. So must anything that has to observe a
// deletion/ban within the same access-token lifetime; see the trade-off note in
// `@/utils/supabase/claims`.
export const getCachedAuthUser = cache(async () => {
  const client = await getServerClient();
  const { user } = await getAuthClaimsUser(client);
  return user;
});

// Memoized per request: layout + page data fns need the enriched app user.
// Built on getCachedAuthUser so the underlying getUser round-trip is shared.
export const getAuthUser = cache(async (): Promise<User | null> => {
  const authUser = await getCachedAuthUser();
  if (!authUser) return null;

  const client = await getServerClient();
  const userId = authUser.id;
  const email = authUser.email ?? '';

  const { data: profile } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  const p = (profile as ProfileRow | null) ?? null;
  const fallbackName = email.split('@')[0] || 'user';
  const displayName =
    p?.display_name ||
    [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() ||
    p?.username ||
    fallbackName;

  return {
    id: userId,
    username: p?.username ?? fallbackName,
    displayName,
    avatarUrl: p?.avatar_url ? withImageVariant(p.avatar_url, 'avatar') : null,
    email,
  };
});
