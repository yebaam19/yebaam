import 'server-only'

import { getServerClient } from '@/utils/supabase/server'
import type {
  PublicChatTopic,
  PublicMessageWithSender,
} from '../types'

const MESSAGE_SELECT =
  'id, content, sender_id, created_at, is_deleted, topic_id, sender:sender_id(username, display_name, avatar_url)'

const TOPIC_COLUMNS =
  'id, slug, name, description, position, is_archived, owner_type, owner_id'

/**
 * Returns only canonical (non-scoped) topics so the global topic tab list
 * stays small. Per-entity topics (e.g. blog rooms) are still reachable by
 * direct URL via getTopicBySlug.
 */
export async function listTopics(): Promise<PublicChatTopic[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('public_chat_topics')
    .select(TOPIC_COLUMNS)
    .eq('is_archived', false)
    .is('owner_type', null)
    .order('position', { ascending: true })
  return (data as PublicChatTopic[] | null) ?? []
}

export async function getTopicBySlug(slug: string): Promise<PublicChatTopic | null> {
  if (!slug) return null
  const client = await getServerClient()
  const { data } = await client
    .from('public_chat_topics')
    .select(TOPIC_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()
  return (data as PublicChatTopic | null) ?? null
}

/** Look up the blog this topic belongs to (slug + name) for back-navigation. */
export async function getTopicOwnerBlog(
  topic: PublicChatTopic,
): Promise<{ id: string; slug: string; name: string } | null> {
  if (topic.owner_type !== 'blog' || !topic.owner_id) return null
  const client = await getServerClient()
  const { data } = await client
    .from('blogs')
    .select('id, slug, name')
    .eq('id', topic.owner_id)
    .maybeSingle()
  return (data as { id: string; slug: string; name: string } | null) ?? null
}

export async function listMessagesForTopic(
  topicId: string,
  limit = 50,
): Promise<PublicMessageWithSender[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('public_chat_messages')
    .select(MESSAGE_SELECT)
    .eq('topic_id', topicId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data as unknown as PublicMessageWithSender[] | null) ?? []
}
