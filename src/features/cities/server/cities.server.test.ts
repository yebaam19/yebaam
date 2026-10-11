import { describe, expect, it, beforeAll } from 'vitest';
import { getPublicServerClient } from '@/utils/supabase/public-server';
import { fetchCities, fetchGlobalStats } from './cities.server';

/**
 * These tests hit the real Supabase project (anon role) and rely on the
 * Phase 0 seed: 8 Latin American cities, plus cities added later. RLS for
 * the `cities` table grants `select` to `anon`, so the publishable key
 * is sufficient and using the service role would mask RLS regressions.
 */
function makeAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in env',
    );
  }
  return getPublicServerClient();
}

type PublicClient = ReturnType<typeof makeAnonClient>;
const seededCitySlugs = [
  'popayan', 'bogota', 'medellin', 'cali', 'lima',
  'ciudad-de-mexico', 'buenos-aires', 'santiago',
];

describe('fetchCities', () => {
  let client: PublicClient;

  beforeAll(() => {
    client = makeAnonClient();
  });

  it('includes the seeded cities and sorts featured-first as the catalog grows', async () => {
    const cities = await fetchCities(client);
    expect(cities.map((city) => city.slug)).toEqual(expect.arrayContaining(seededCitySlugs));

    // Featured cities (Popayán, Bogotá) must precede non-featured.
    const firstNonFeaturedIdx = cities.findIndex((c) => !c.isFeatured);
    const lastFeaturedIdx = cities.map((c) => c.isFeatured).lastIndexOf(true);
    expect(lastFeaturedIdx).toBeLessThan(firstNonFeaturedIdx);
  });

  it('filters by name with ?q (case-insensitive)', async () => {
    const cities = await fetchCities(client, { q: 'pop' });
    expect(cities).toHaveLength(1);
    expect(cities[0].slug).toBe('popayan');
  });

  it('returns an empty array when ?q matches nothing', async () => {
    const cities = await fetchCities(client, { q: 'zzzzzzz-no-match' });
    expect(cities).toEqual([]);
  });

  it('filters by country code (CO returns 4 Colombian cities)', async () => {
    const cities = await fetchCities(client, { countryCode: 'CO' });
    expect(cities.length).toBeGreaterThanOrEqual(4);
    for (const c of cities) {
      expect(c.country?.code).toBe('CO');
    }
  });

  it('returns an empty array for an unknown country code', async () => {
    const cities = await fetchCities(client, { countryCode: 'XX' });
    expect(cities).toEqual([]);
  });
});

describe('fetchGlobalStats', () => {
  let client: PublicClient;

  beforeAll(() => {
    client = makeAnonClient();
  });

  it('returns numeric totals that include the seeded cities', async () => {
    const stats = await fetchGlobalStats(client);
    expect(Number.isInteger(stats.totalCities)).toBe(true);
    expect(stats.totalCities).toBeGreaterThanOrEqual(seededCitySlugs.length);
    expect(typeof stats.totalUsers).toBe('number');
    expect(typeof stats.totalMedia).toBe('number');
    expect(stats.totalUsers).toBeGreaterThanOrEqual(0);
    expect(stats.totalMedia).toBeGreaterThanOrEqual(0);
  });
});
