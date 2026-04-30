import 'server-only';

import { getServerClient, getServiceClient } from '@/utils/supabase/server';

export interface CommunityChatTopic {
  id: string;
  slug: string;
  name: string;
}

/**
 * Returns the chat-publico topic dedicated to a community, creating it on
 * first call. The topic slug is the route segment users land on at
 * `/feed/chat-publico/<topicSlug>` so the existing chat UI/identity flow can
 * be reused unchanged.
 *
 * Uses the service-role client for the SELECT (the topic may not yet exist
 * for non-members under RLS) and for the INSERT (only the community owner
 * could otherwise create it under default policies).
 */
export async function getOrCreateCommunityChatTopic(community: {
  id: string;
  slug: string;
  name: string;
}): Promise<CommunityChatTopic | null> {
  const service = getServiceClient();
  const { data: existing } = await service
    .from('public_chat_topics')
    .select('id, slug, name')
    .eq('owner_type', 'community')
    .eq('owner_id', community.id)
    .maybeSingle();

  if (existing) {
    return existing as CommunityChatTopic;
  }

  const topicSlug = `comunidad-${community.slug}`;
  const topicName = `Chat de ${community.name}`;
  const { data: inserted, error } = await service
    .from('public_chat_topics')
    .insert({
      slug: topicSlug,
      name: topicName,
      description: `Sala de chat público para la comunidad ${community.name}.`,
      owner_type: 'community',
      owner_id: community.id,
      is_archived: false,
      is_permanent: true,
    })
    .select('id, slug, name')
    .maybeSingle();

  if (error || !inserted) return null;
  return inserted as CommunityChatTopic;
}

/**
 * Lightweight read for member-only consumers (e.g. the community chat panel)
 * that just need to know whether a topic exists yet without provisioning one.
 * Falls back to the cookie-bound server client so RLS still applies.
 */
export async function findCommunityChatTopic(communityId: string): Promise<CommunityChatTopic | null> {
  const client = await getServerClient();
  const { data } = await client
    .from('public_chat_topics')
    .select('id, slug, name')
    .eq('owner_type', 'community')
    .eq('owner_id', communityId)
    .maybeSingle();
  return (data as CommunityChatTopic | null) ?? null;
}
