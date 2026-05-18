import { describe, expect, it, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { fetchCityBySlug } from './city.server';

/**
 * Vertical-slice TDD tests for `fetchCityBySlug`. Hits the real Phase-0-seeded
 * Supabase project as anon so RLS regressions surface the same way they would
 * in production. The publishable key is enough; service-role would mask anon
 * access.
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
