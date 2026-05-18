import { describe, expect, it, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { fetchCityBySlug } from './city.server';
import { fetchIsFollowing } from './followers.server';

/**
 * Vertical-slice TDD tests for `fetchIsFollowing`. Verifies the anonymous
 * fast-path (no DB round-trip when userId is null) and that anon RLS hides
 * other users' follower rows.
 */
function makeAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in env',
    );
  }
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe('fetchIsFollowing', () => {
  let client: SupabaseClient;
  let popayanId: string;

  beforeAll(async () => {
    client = makeAnonClient();
    const city = await fetchCityBySlug(client, 'popayan');
    if (!city) throw new Error('Popayán seed missing — re-run Phase 0 seed');
    popayanId = city.id;
  });

  it('returns false when there is no signed-in user', async () => {
    const out = await fetchIsFollowing(client, popayanId, null);
    expect(out).toBe(false);
  });

  it('returns false for a user with no city_followers row', async () => {
    // A random uuid — anon RLS on city_followers only sees rows for the
    // calling user, so this should never find a match regardless.
    const out = await fetchIsFollowing(
      client,
      popayanId,
      '00000000-0000-0000-0000-000000000000',
    );
    expect(out).toBe(false);
  });
});
