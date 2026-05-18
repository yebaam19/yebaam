import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';

/**
 * Server-side reads + provisioning for the city-anchored public chat.
 *
 * Two shapes live here on purpose:
 *   - `getOrCreatePublicChatTopicForCity(cityId)` is service-role only.
 *     `public_chat_topics` SELECT is authenticated-only and INSERT requires
 *     the elevated role, so RSC pages anchored on cities (which anonymous
 *     visitors can hit) must call this through the service client.
 *   - `fetchInitialMessages(client, topicId, limit)` accepts a Supabase
 *     client so vitest can hit it with the anon publishable key and assert
 *     RLS still lets anon SELECT messages (which it does — see the migration
 *     `public_chat_messages_select_all` policy).
 *
 * Both reads are `cache()`-wrapped at the request layer so the RSC page can
 * call them and the resulting Suspense boundary streams the chat without
 * a duplicate round-trip.
 */

const CF_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? '';

function cfImageUrl(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  if (!CF_ACCOUNT_HASH) return undefined;
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${id}/public`;
}

const TOPIC_SELECT =
  'id, slug, name, description, city_id, is_permanent, max_capacity, is_archived, visibility, created_at';

const MESSAGE_SELECT =
  'id, content, sender_id, sender_kind, sender_nickname, sender_avatar_url, created_at, topic_id, is_deleted, ' +
  'author:profiles!sender_id(id, display_name, username, avatar_url, avatar_cloudflare_id)';

export interface PublicChatTopic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  city_id: string;
  is_permanent: boolean;
  max_capacity: number;
  is_archived: boolean;
  visibility: string;
  created_at: string;
}

export interface PublicChatAuthor {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface PublicChatMessage {
  id: string;
  topic_id: string;
  sender_id: string | null;
  content: string | null;
  created_at: string;
  is_deleted: boolean;
  sender_nickname: string | null;
  sender_avatar_url: string | null;
  author: PublicChatAuthor | null;
}

type ProfileJoin = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_cloudflare_id: string | null;
};

type MessageRow = {
  id: string;
  content: string | null;
  sender_id: string | null;
  sender_kind: string;
  sender_nickname: string | null;
  sender_avatar_url: string | null;
  created_at: string;
  topic_id: string;
  is_deleted: boolean;
  author: ProfileJoin | ProfileJoin[] | null;
};

function pickAuthor(row: MessageRow): ProfileJoin | null {
  const a = row.author;
  if (!a) return null;
  if (Array.isArray(a)) return a[0] ?? null;
  return a;
}

function toAuthorDto(row: ProfileJoin | null): PublicChatAuthor | null {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name ?? row.username ?? 'Usuario',
    username: row.username,
    avatarUrl: cfImageUrl(row.avatar_cloudflare_id) ?? row.avatar_url ?? null,
  };
}

function toMessageDto(row: MessageRow): PublicChatMessage {
  const profile = pickAuthor(row);
  return {
    id: row.id,
    topic_id: row.topic_id,
    sender_id: row.sender_id,
    content: row.content,
    created_at: row.created_at,
    is_deleted: row.is_deleted,
    sender_nickname: row.sender_nickname,
    sender_avatar_url: row.sender_avatar_url,
    author: toAuthorDto(profile),
  };
}

/**
 * Idempotent: returns the existing city-anchored topic on every call after
 * the first. The slug template `city-${cityId}` lets us hit the unique-slug
 * constraint to absorb the rare race where two RSC requests land at the
 * same instant before either INSERT lands.
 */
export async function getOrCreatePublicChatTopicForCity(
  cityId: string,
): Promise<PublicChatTopic> {
  const service = getServiceClient();

  const { data: existing, error: readError } = await service
    .from('public_chat_topics')
    .select(TOPIC_SELECT)
    .eq('city_id', cityId)
    .is('parent_topic_id', null)
    .maybeSingle();

  if (readError) {
    throw new Error(`[getOrCreatePublicChatTopicForCity] read failed: ${readError.message}`);
  }
  if (existing) return existing as PublicChatTopic;

  const insertPayload = {
    slug: `city-${cityId}`,
    name: 'Chat público',
    description: 'Sala de chat público permanente para la comunidad de la ciudad.',
    city_id: cityId,
    is_permanent: true,
    max_capacity: 250,
    is_archived: false,
    visibility: 'public',
    owner_type: 'city',
    owner_id: cityId,
  };

  const { data: inserted, error: insertError } = await service
    .from('public_chat_topics')
    .insert(insertPayload)
    .select(TOPIC_SELECT)
    .maybeSingle();

  // Idempotency guard: if a sibling request inserted between our SELECT and
  // INSERT, the unique-slug constraint fires — re-read instead of throwing.
  if (insertError) {
    const { data: retry } = await service
      .from('public_chat_topics')
      .select(TOPIC_SELECT)
      .eq('city_id', cityId)
      .is('parent_topic_id', null)
      .maybeSingle();
    if (retry) return retry as PublicChatTopic;
    throw new Error(`[getOrCreatePublicChatTopicForCity] insert failed: ${insertError.message}`);
  }
  if (!inserted) {
    throw new Error('[getOrCreatePublicChatTopicForCity] insert returned no row');
  }
  return inserted as PublicChatTopic;
}

/**
 * Pure-read function returning the most recent N messages with their author
 * profile joined. Sorted newest-first server-side; the client component
 * reverses it for display so newer messages appear at the bottom.
 */
export async function fetchInitialMessages(
  client: SupabaseClient,
  topicId: string,
  limit = 50,
): Promise<PublicChatMessage[]> {
  const { data, error } = await client
    .from('public_chat_messages')
    .select(MESSAGE_SELECT)
    .eq('topic_id', topicId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[fetchInitialMessages]', error);
    return [];
  }
  return (data ?? []).map((row) => toMessageDto(row as unknown as MessageRow));
}

// ---------------------------------------------------------------------------
// Request-cached wrappers — only safe inside an RSC / Server Action.
// ---------------------------------------------------------------------------

export const getOrCreatePublicChatTopicForCityCached = cache(
  async (cityId: string): Promise<PublicChatTopic> =>
    getOrCreatePublicChatTopicForCity(cityId),
);

export const listInitialMessages = cache(
  async (topicId: string, limit = 50): Promise<PublicChatMessage[]> => {
    const client = await getServerClient();
    return fetchInitialMessages(client, topicId, limit);
  },
);
