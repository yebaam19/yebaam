import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  fetchCityInboxForAdmin,
  fetchMyMessagesForCity,
} from './contact.server';
import { fetchCityBySlug } from './city.server';

/**
 * TDD tests for the city contact-messages server functions.
 *
 * The RLS contract here is more interesting than classifieds/social-help:
 * `city_contact_messages_sender_read_own` lets a sender see their own row,
 * `city_contact_messages_admin_read_all` lets a city admin see every row,
 * and there is no public-read policy at all. The anon role therefore can
 * never list this table — we assert that explicitly so a future migration
 * that adds a public-read policy fails loud rather than silently leaking.
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

describe('fetchMyMessagesForCity / RLS', () => {
  let anon: SupabaseClient;
  let service: SupabaseClient;
  let popayanId: string;
  const seededIds: string[] = [];
  // FK on `sender_id → auth.users(id)` — use a real seeded user from the dev
  // project. Any one will do; we never sign in as them, we just need a row
  // whose `sender_id` resolves so the test seed can land.
  const SYNTHETIC_USER_ID = '1e749697-9fb8-4383-b252-722d7337a93b';

  beforeAll(async () => {
    anon = makeAnonClient();
    service = makeServiceClient();
    const city = await fetchCityBySlug(anon, 'popayan');
    if (!city) throw new Error('Popayán seed missing — re-run Phase 0 seed');
    popayanId = city.id;

    const { data, error } = await service
      .from('city_contact_messages')
      .insert([
        {
          city_id: popayanId,
          sender_id: SYNTHETIC_USER_ID,
          subject: '__TEST__ inbox subject A',
          body: 'first contact message body',
          status: 'new',
        },
        {
          city_id: popayanId,
          sender_id: SYNTHETIC_USER_ID,
          subject: '__TEST__ inbox subject B',
          body: 'second contact message body',
          status: 'new',
        },
      ])
      .select('id');
    if (error) throw error;
    for (const r of data ?? []) seededIds.push(r.id as string);
  });

  afterAll(async () => {
    if (seededIds.length === 0) return;
    try {
      await service.from('city_contact_messages').delete().in('id', seededIds);
    } catch {
      // best-effort
    }
  });

  it('returns an empty array for an anon caller asking about a sender other than themselves', async () => {
    // The function passes `userId` for the call site to gate UI display, but
    // the underlying read is still bound by anon's auth.uid() which is null.
    // RLS therefore returns no rows.
    const rows = await fetchMyMessagesForCity(anon, popayanId, SYNTHETIC_USER_ID);
    expect(rows).toEqual([]);
  });

  it('returns an empty array when called with a null user', async () => {
    const rows = await fetchMyMessagesForCity(anon, popayanId, null);
    expect(rows).toEqual([]);
  });
});

describe('fetchCityInboxForAdmin (service role bypass)', () => {
  let service: SupabaseClient;
  let anon: SupabaseClient;
  let popayanId: string;
  const seededIds: string[] = [];

  beforeAll(async () => {
    service = makeServiceClient();
    anon = makeAnonClient();
    const city = await fetchCityBySlug(anon, 'popayan');
    if (!city) throw new Error('Popayán seed missing — re-run Phase 0 seed');
    popayanId = city.id;

    const { data, error } = await service
      .from('city_contact_messages')
      .insert([
        {
          city_id: popayanId,
          sender_id: 'd5c41709-5a3a-4257-b3e0-2e3868bb43a7',
          subject: '__TEST__ admin-visible 1',
          body: 'body one',
          status: 'new',
        },
        {
          city_id: popayanId,
          sender_id: '8dd2a46f-41d5-48c5-b777-6326b1326340',
          subject: '__TEST__ admin-visible 2',
          body: 'body two',
          status: 'read',
        },
      ])
      .select('id');
    if (error) throw error;
    for (const r of data ?? []) seededIds.push(r.id as string);
  });

  afterAll(async () => {
    if (seededIds.length === 0) return;
    try {
      await service.from('city_contact_messages').delete().in('id', seededIds);
    } catch {
      // best-effort
    }
  });

  it('returns rows from multiple senders when called with the service-role client', async () => {
    const rows = await fetchCityInboxForAdmin(service, popayanId);
    const subjects = rows.map((r) => r.subject);
    expect(subjects).toContain('__TEST__ admin-visible 1');
    expect(subjects).toContain('__TEST__ admin-visible 2');
  });

  it('returns an empty array (RLS) when called by anon', async () => {
    const rows = await fetchCityInboxForAdmin(anon, popayanId);
    expect(rows).toEqual([]);
  });
});

describe('contact RLS — anon write rejection', () => {
  it('rejects an anonymous direct insert', async () => {
    const anon = makeAnonClient();
    const popayan = await fetchCityBySlug(anon, 'popayan');
    expect(popayan).not.toBeNull();
    const { error } = await anon.from('city_contact_messages').insert({
      city_id: popayan!.id,
      sender_id: '1e749697-9fb8-4383-b252-722d7337a93b',
      subject: '__TEST__ should-never-land',
      body: 'rejected',
    });
    expect(error).not.toBeNull();
  });
});
