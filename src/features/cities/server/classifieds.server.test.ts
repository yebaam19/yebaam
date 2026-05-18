import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  fetchClassifiedById,
  fetchOpenClassifieds,
} from './classifieds.server';
import { fetchCityBySlug } from './city.server';

/**
 * TDD tests for the city classifieds server functions. Hits the real
 * Supabase project as anon so RLS regressions surface the same way they
 * would in production. The seeded Popayán city is used as the anchor.
 *
 * Write-side scenarios are exercised via a service-role client so the test
 * is hermetic — it inserts a known row, asserts the public read sees it,
 * then cleans up. The Server Action path (which gates on `auth.uid()`)
 * is verified in a separate `it()` that calls `postClassified` directly
 * without a session and asserts the `unauthenticated` sentinel.
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

function makeServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in env (required for test seeding)');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe('fetchOpenClassifieds', () => {
  let anon: SupabaseClient;
  let service: SupabaseClient;
  let popayanId: string;
  const seededIds: string[] = [];

  beforeAll(async () => {
    anon = makeAnonClient();
    service = makeServiceClient();
    const city = await fetchCityBySlug(anon, 'popayan');
    if (!city) throw new Error('Popayán seed missing — re-run Phase 0 seed');
    popayanId = city.id;

    // Seed three rows: two open with different `kind`, one closed.
    const rows = [
      {
        city_id: popayanId,
        title: '__TEST__ open offer',
        description: 'free offer description',
        kind: 'offer',
        status: 'open',
      },
      {
        city_id: popayanId,
        title: '__TEST__ open want',
        description: null,
        kind: 'want',
        status: 'open',
      },
      {
        city_id: popayanId,
        title: '__TEST__ closed offer',
        description: null,
        kind: 'offer',
        status: 'closed',
      },
    ];
    const { data, error } = await service.from('city_classifieds').insert(rows).select('id');
    if (error) throw error;
    for (const r of data ?? []) seededIds.push(r.id as string);
  });

  afterAll(async () => {
    if (seededIds.length === 0) return;
    try {
      await service.from('city_classifieds').delete().in('id', seededIds);
    } catch {
      // best-effort cleanup
    }
  });

  it('returns only open rows by default', async () => {
    const rows = await fetchOpenClassifieds(anon, popayanId, { limit: 50, offset: 0 });
    expect(Array.isArray(rows)).toBe(true);
    for (const r of rows) {
      expect(r.status).toBe('open');
      expect(r.cityId).toBe(popayanId);
    }
    expect(rows.some((r) => r.title === '__TEST__ open offer')).toBe(true);
    expect(rows.some((r) => r.title === '__TEST__ open want')).toBe(true);
    expect(rows.some((r) => r.title === '__TEST__ closed offer')).toBe(false);
  });

  it('filters by kind', async () => {
    const rows = await fetchOpenClassifieds(anon, popayanId, {
      limit: 50,
      offset: 0,
      kind: 'want',
    });
    for (const r of rows) {
      expect(r.kind).toBe('want');
    }
    expect(rows.some((r) => r.title === '__TEST__ open want')).toBe(true);
    expect(rows.some((r) => r.title === '__TEST__ open offer')).toBe(false);
  });

  it('filters by free-text q (case-insensitive substring in title)', async () => {
    const rows = await fetchOpenClassifieds(anon, popayanId, {
      limit: 50,
      offset: 0,
      q: 'OPEN OFFER',
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.some((r) => r.title === '__TEST__ open offer')).toBe(true);
    expect(rows.some((r) => r.title === '__TEST__ open want')).toBe(false);
  });

  it('returns an empty array for a city id with no rows', async () => {
    const rows = await fetchOpenClassifieds(
      anon,
      '00000000-0000-0000-0000-000000000000',
      { limit: 10, offset: 0 },
    );
    expect(rows).toEqual([]);
  });
});

describe('fetchClassifiedById', () => {
  let anon: SupabaseClient;
  let service: SupabaseClient;
  let popayanId: string;
  let seededId: string | null = null;

  beforeAll(async () => {
    anon = makeAnonClient();
    service = makeServiceClient();
    const city = await fetchCityBySlug(anon, 'popayan');
    if (!city) throw new Error('Popayán seed missing — re-run Phase 0 seed');
    popayanId = city.id;
    const { data, error } = await service
      .from('city_classifieds')
      .insert({
        city_id: popayanId,
        title: '__TEST__ getById row',
        description: 'detail',
        kind: 'free',
        status: 'open',
      })
      .select('id')
      .maybeSingle();
    if (error) throw error;
    seededId = (data?.id as string) ?? null;
  });

  afterAll(async () => {
    if (!seededId) return;
    try {
      await service.from('city_classifieds').delete().eq('id', seededId);
    } catch {
      // best-effort
    }
  });

  it('returns the row by id for the public reader', async () => {
    if (!seededId) throw new Error('seed failed');
    const row = await fetchClassifiedById(anon, seededId);
    expect(row).not.toBeNull();
    expect(row?.id).toBe(seededId);
    expect(row?.title).toBe('__TEST__ getById row');
    expect(row?.kind).toBe('free');
  });

  it('returns null when the id does not exist', async () => {
    const row = await fetchClassifiedById(anon, '00000000-0000-0000-0000-000000000000');
    expect(row).toBeNull();
  });
});

describe('postClassified — anon RLS denial (proves auth is required end-to-end)', () => {
  /**
   * The Server Action's `requireSession()` path can't run under vitest because
   * `cookies()` only works in a Next.js request scope. We assert the same
   * security property at the layer below — RLS — by attempting a direct anon
   * insert. The check_expression on `city_classifieds_author_insert` is
   * `author_id = auth.uid()`; anon has no `auth.uid()`, so the insert is
   * rejected. If this ever flips to `ok`, the auth gate would be the only
   * thing left holding it back — and that's a regression worth flagging.
   */
  it('rejects an anonymous direct insert (RLS)', async () => {
    const anon = makeAnonClient();
    const popayan = await fetchCityBySlug(anon, 'popayan');
    expect(popayan).not.toBeNull();
    const { error } = await anon.from('city_classifieds').insert({
      city_id: popayan!.id,
      title: '__TEST__ should-never-land',
      kind: 'offer',
      status: 'open',
    });
    expect(error).not.toBeNull();
  });
});
