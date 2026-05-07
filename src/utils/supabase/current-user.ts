import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { supabase } from './client';

/**
 * Shared cache for the current user's id. Reading `supabase.auth.getUser()`
 * takes a Web Lock (`navigator.locks`) — if multiple services call it in
 * parallel, one call "steals" the lock from another and supabase-js logs
 * `Lock ... was released because another request stole it`. We read once,
 * cache the result, and refresh via `onAuthStateChange`.
 *
 * Use `getCurrentUserId()` from any client-side service; do not call
 * `supabase.auth.getUser()` directly in per-request helpers.
 */

let cachedUserId: string | null | undefined;
let inflight: Promise<string | null> | null = null;

if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    cachedUserId = session?.user?.id ?? null;
  });
}

export async function getCurrentUserId(): Promise<string | null> {
  if (cachedUserId !== undefined) return cachedUserId;
  if (inflight) return inflight;
  inflight = supabase.auth
    .getSession()
    .then(({ data }: { data: { session: Session | null } }) => {
      cachedUserId = data.session?.user?.id ?? null;
      return cachedUserId;
    })
    .catch(() => {
      cachedUserId = null;
      return null;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Force a refresh — useful right after sign-in or token refresh. */
export function invalidateCurrentUserId(): void {
  cachedUserId = undefined;
}
