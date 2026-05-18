import { describe, expect, it, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  fetchCityBySlug,
  fetchCityPortalData,
  fetchIsFollowing,
} from './city.server';

/**
 * Vertical-slice TDD tests for the city detail server functions.
 * Each `it()` block exercises one observable behaviour through the public
 * interface. They run against the real Phase-0-seeded Supabase project as
 * the anon role — that surfaces RLS regressions the same way production
 * would. The publishable key is enough; service-role would mask anon access.
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

describe('fetchCityBySlug', () => {
  let client: SupabaseClient;

  beforeAll(() => {
    client = makeAnonClient();
  });

  it('returns the seeded Popayán row by slug', async () => {
    const city = await fetchCityBySlug(client, 'popayan');
    expect(city).not.toBeNull();
    expect(city?.name).toBe('Popayán');
    expect(city?.slug).toBe('popayan');
    expect(city?.country.name).toBe('Colombia');
  });

  it('returns null for a slug that does not exist', async () => {
    const city = await fetchCityBySlug(client, 'this-city-does-not-exist');
    expect(city).toBeNull();
  });
});

describe('fetchCityPortalData', () => {
  let client: SupabaseClient;
  let popayanId: string;

  beforeAll(async () => {
    client = makeAnonClient();
    const city = await fetchCityBySlug(client, 'popayan');
    if (!city) throw new Error('Popayán seed missing — re-run Phase 0 seed');
    popayanId = city.id;
  });

  it('returns numeric counts for every tile-relevant field', async () => {
    const data = await fetchCityPortalData(client, popayanId);
    expect(typeof data.newsCount).toBe('number');
    expect(typeof data.promotionCount).toBe('number');
    expect(typeof data.classifiedCount).toBe('number');
    expect(typeof data.socialHelpCount).toBe('number');
    expect(typeof data.placeCount).toBe('number');
    expect(typeof data.businessCount).toBe('number');
    expect(typeof data.communityCount).toBe('number');
    expect(typeof data.clubCount).toBe('number');
    expect(typeof data.blogCount).toBe('number');
    expect(typeof data.forumCount).toBe('number');
    // No row should ever return a negative count — defends against
    // surprise `null`s leaking through `count ?? 0` later.
    for (const v of Object.values(data)) {
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});

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
