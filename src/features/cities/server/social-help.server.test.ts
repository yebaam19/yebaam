import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  fetchHelpById,
  fetchOpenSocialHelp,
} from './social-help.server';
import { fetchCityBySlug } from './city.server';

/**
 * TDD tests for the city social-help server functions. Hits the real
 * Supabase project as anon so RLS regressions surface the same way they
 * would in production. Mirrors the classifieds test for structure.
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

describe('fetchOpenSocialHelp', () => {
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

    const rows = [
      {
        city_id: popayanId,
        title: '__TEST__ help offer',
        description: 'I can drive someone to a doctor visit',
        kind: 'offer',
        status: 'open',
      },
      {
        city_id: popayanId,
        title: '__TEST__ help need',
        description: 'Need a coat for the winter',
        kind: 'need',
        status: 'open',
      },
      {
        city_id: popayanId,
        title: '__TEST__ help closed',
        description: 'Resolved request',
        kind: 'need',
        status: 'closed',
      },
    ];
    const { data, error } = await service.from('city_social_help').insert(rows).select('id');
    if (error) throw error;
    for (const r of data ?? []) seededIds.push(r.id as string);
  });

  afterAll(async () => {
    if (seededIds.length === 0) return;
    try {
      await service.from('city_social_help').delete().in('id', seededIds);
    } catch {
      // best-effort
    }
  });

  it('returns only open rows by default', async () => {
    const rows = await fetchOpenSocialHelp(anon, popayanId, { limit: 50, offset: 0 });
    for (const r of rows) {
      expect(r.status).toBe('open');
      expect(r.cityId).toBe(popayanId);
    }
    expect(rows.some((r) => r.title === '__TEST__ help offer')).toBe(true);
    expect(rows.some((r) => r.title === '__TEST__ help need')).toBe(true);
    expect(rows.some((r) => r.title === '__TEST__ help closed')).toBe(false);
  });

  it('filters by kind', async () => {
    const rows = await fetchOpenSocialHelp(anon, popayanId, {
      limit: 50,
      offset: 0,
      kind: 'need',
    });
    for (const r of rows) {
      expect(r.kind).toBe('need');
    }
    expect(rows.some((r) => r.title === '__TEST__ help need')).toBe(true);
    expect(rows.some((r) => r.title === '__TEST__ help offer')).toBe(false);
  });

  it('returns an empty array for a city id with no rows', async () => {
    const rows = await fetchOpenSocialHelp(
      anon,
      '00000000-0000-0000-0000-000000000000',
      { limit: 10, offset: 0 },
    );
    expect(rows).toEqual([]);
  });
});

describe('fetchHelpById', () => {
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
      .from('city_social_help')
      .insert({
        city_id: popayanId,
        title: '__TEST__ getById help',
        description: 'detail body',
        kind: 'offer',
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
      await service.from('city_social_help').delete().eq('id', seededId);
    } catch {
      // best-effort
    }
  });

  it('returns the row by id for the public reader', async () => {
    if (!seededId) throw new Error('seed failed');
    const row = await fetchHelpById(anon, seededId);
    expect(row).not.toBeNull();
    expect(row?.id).toBe(seededId);
    expect(row?.title).toBe('__TEST__ getById help');
    expect(row?.kind).toBe('offer');
  });

  it('returns null when the id does not exist', async () => {
    const row = await fetchHelpById(anon, '00000000-0000-0000-0000-000000000000');
    expect(row).toBeNull();
  });
});

describe('social-help RLS — anon write rejection', () => {
  it('rejects an anonymous direct insert', async () => {
    const anon = makeAnonClient();
    const popayan = await fetchCityBySlug(anon, 'popayan');
    expect(popayan).not.toBeNull();
    const { error } = await anon.from('city_social_help').insert({
      city_id: popayan!.id,
      title: '__TEST__ should-never-land',
      kind: 'offer',
      status: 'open',
    });
    expect(error).not.toBeNull();
  });
});
