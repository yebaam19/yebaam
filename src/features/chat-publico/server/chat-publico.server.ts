import 'server-only'

import { getServerClient } from '@/utils/supabase/server'
import type {
  PublicChatTopic,
  PublicMessageWithSender,
} from '../types'

const MESSAGE_SELECT =
  'id, content, sender_id, created_at, is_deleted, topic_id, sender:sender_id(username, display_name, avatar_url)'

export async function listTopics(): Promise<PublicChatTopic[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('public_chat_topics')
    .select('id, slug, name, description, position, is_archived')
    .eq('is_archived', false)
    .order('position', { ascending: true })
  return (data as PublicChatTopic[] | null) ?? []
}

export async function getTopicBySlug(slug: string): Promise<PublicChatTopic | null> {
  if (!slug) return null
  const client = await getServerClient()
  const { data } = await client
    .from('public_chat_topics')
    .select('id, slug, name, description, position, is_archived')
    .eq('slug', slug)
    .maybeSingle()
  return (data as PublicChatTopic | null) ?? null
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
