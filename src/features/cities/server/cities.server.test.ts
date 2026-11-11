import { describe, expect, it, beforeAll } from 'vitest';
import { fetchCountries, fetchStates } from './discovery-options.server';
import { getPublicServerClient } from '@/utils/supabase/public-server';
import { fetchCities, fetchGlobalStats, fetchCitiesPage } from './cities.server';

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
    const cities = await fetchCities(client, { pageSize: 48 });
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

it('keeps every supported country selectable even before its first city', async () => {
  const data = await fetchCountries(makeAnonClient());
  const expectedCodes = [
    'AG', 'AR', 'BB', 'BO', 'BR', 'BS', 'BZ', 'CL', 'CO', 'CR', 'CU',
    'DM', 'DO', 'EC', 'ES', 'GD', 'GF', 'GT', 'GY', 'HN', 'HT', 'JM',
    'KN', 'LC', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SR', 'SV', 'TT',
    'US', 'UY', 'VC', 'VE',
  ];
  expect(data?.map((country) => country.code)).toEqual(expect.arrayContaining(expectedCodes));
  for (const code of expectedCodes) {
    const matches = data?.filter((country) => country.code === code) ?? [];
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBeTruthy();
    expect(matches[0].name.trim()).not.toBe('');
  }
});

it.each([
  ['Estados Unidos', 'miami', 'US'], ['USA', 'houston', 'US'],
  ['Texas', 'dallas', 'US'], ['Texsa', 'austin', 'US'],
  ['Espana', 'madrid', 'ES'], ['Madrd', 'madrid', 'ES'],
  ['Sao Paulo', 'sao-paulo', 'BR'], ['New York', 'nueva-york', 'US'],
])('finds geography, aliases and spelling variants: %s', async (q, slug, code) => {
  const page = await fetchCitiesPage(makeAnonClient(), { q, pageSize: 48 });
  expect(page.error).toBe(false);
  expect(page.items.map((city) => city.slug)).toContain(slug);
  expect(page.items.every((city) => city.country.code === code)).toBe(true);
  expect(page.total).toBe(page.items.length);
});

it('combines country and state filters with text search', async () => {
  const client = makeAnonClient();
  const states = await fetchStates(client, 'US');
  const texas = states.find((state) => state.name === 'Texas');
  expect(texas?.cityCount).toBeGreaterThanOrEqual(4);
  const page = await fetchCitiesPage(client, { q: 'Estados Unidos', countryCode: 'US', stateId: texas!.id });
  expect(page.error).toBe(false);
  expect(page.items.map((city) => city.slug)).toEqual(expect.arrayContaining(['houston', 'dallas', 'austin', 'san-antonio-texas']));
  expect(page.items.every((city) => city.state?.id === texas!.id)).toBe(true);
  expect((await fetchCitiesPage(client, { q: 'Texas', countryCode: 'ES' })).total).toBe(0);
});

it('paginates without overlap and never hides later catalog entries', async () => {
  const client = makeAnonClient();
  const first = await fetchCitiesPage(client, { pageSize: 4 });
  const second = await fetchCitiesPage(client, { page: 2, pageSize: 4 });
  expect(first.error || second.error).toBe(false);
  expect(first.items).toHaveLength(4);
  expect(second.total).toBe(first.total);
  expect(second.items.every((city) => !first.items.some((previous) => previous.id === city.id))).toBe(true);
});
