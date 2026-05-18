import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  fetchInitialMessages,
  getOrCreatePublicChatTopicForCity,
} from './public-chat.server';

/**
 * TDD tests for the city public-chat server functions. Like the other Phase
 * 1+2 tests we hit the real Supabase project so RLS regressions surface the
 * same way they would in production:
 *
 *   - The topic-create path must run with service-role (RLS on
 *     public_chat_topics is authenticated-only and `creator_id = auth.uid()`
 *     would otherwise hold). We test that path by exercising the production
 *     function — it should NOT need an anon client passed in.
 *   - The message-read path uses anon since `public_chat_messages` SELECT is
 *     open to anon + authenticated. The test passes an anon client explicitly
 *     so it stays in the same shape as `fetchCityPortalData(client, …)`.
 *
 * Cleanup: we remove the topic we create at the end of the suite via the
 * service-role client so re-running the suite does not pile up rows.
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
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in env (required for topic cleanup)');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Popayán is the canonical seeded city from Phase 0 — use it so a missing
// row blows up loudly instead of silently passing.
const POPAYAN_ID = '6571f652-05ea-46f1-9a9b-bcc3d57684c2';

describe('getOrCreatePublicChatTopicForCity', () => {
  let createdTopicId: string | null = null;

  afterAll(async () => {
    if (!createdTopicId) return;
    try {
      const svc = makeServiceClient();
      await svc.from('public_chat_topics').delete().eq('id', createdTopicId);
    } catch {
      // best-effort cleanup
    }
  });

  it('creates a permanent topic with capacity 250 for the city', async () => {
    const topic = await getOrCreatePublicChatTopicForCity(POPAYAN_ID);
    expect(topic).not.toBeNull();
    expect(topic.is_permanent).toBe(true);
    expect(topic.max_capacity).toBe(250);
    expect(topic.city_id).toBe(POPAYAN_ID);
    expect(topic.slug).toBe(`city-${POPAYAN_ID}`);
    createdTopicId = topic.id;
  });

  it('is idempotent — second call returns the same topic id', async () => {
    const a = await getOrCreatePublicChatTopicForCity(POPAYAN_ID);
    const b = await getOrCreatePublicChatTopicForCity(POPAYAN_ID);
    expect(a.id).toBe(b.id);
  });
});

describe('fetchInitialMessages', () => {
  let client: SupabaseClient;
  let topicId: string;

  beforeAll(async () => {
    client = makeAnonClient();
    // We rely on getOrCreatePublicChatTopicForCity being already covered above
    // — this just resolves the same topic id for read tests.
    const topic = await getOrCreatePublicChatTopicForCity(POPAYAN_ID);
    topicId = topic.id;
  });

  it('returns at most N messages ordered newest-first', async () => {
    const rows = await fetchInitialMessages(client, topicId, 5);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeLessThanOrEqual(5);
    // Sorted by created_at desc — verify monotonicity when there's >= 2 rows.
    for (let i = 1; i < rows.length; i += 1) {
      expect(new Date(rows[i].created_at).getTime()).toBeLessThanOrEqual(
        new Date(rows[i - 1].created_at).getTime(),
      );
    }
  });

  it('returns an empty array for a topic that does not exist', async () => {
    const rows = await fetchInitialMessages(
      client,
      '00000000-0000-0000-0000-000000000000',
      10,
    );
    expect(rows).toEqual([]);
  });
});
