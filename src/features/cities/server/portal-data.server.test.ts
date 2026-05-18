import { describe, expect, it, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { fetchCityBySlug } from './city.server';
import { fetchCityPortalData } from './portal-data.server';

/**
 * Vertical-slice TDD tests for `fetchCityPortalData`. Counts depend on the
 * Phase-0 + Phase-5 seed data; if any of these expectations regress, the
 * culprit is either the safeCount / countCityRows helper or the underlying
 * RLS policy.
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
    // No row should ever return a negative count — defends against surprise
    // `null`s leaking through `count ?? 0` later.
    for (const v of Object.values(data)) {
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});
