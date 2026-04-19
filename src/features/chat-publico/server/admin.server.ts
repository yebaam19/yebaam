import 'server-only'

import { getServerClient } from '@/utils/supabase/server'
import type {
  PublicChatTopic,
  PublicMessageWithSender,
} from '../types'

const MESSAGE_SELECT =
  'id, content, sender_id, created_at, is_deleted, topic_id, sender:sender_id(username, display_name, avatar_url)'

export async function listAdminTopics(): Promise<PublicChatTopic[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('public_chat_topics')
    .select('id, slug, name, description, position, is_archived, owner_type, owner_id')
    .order('position', { ascending: true })
    .order('name', { ascending: true })
  return (data as PublicChatTopic[] | null) ?? []
}

export interface AdminMessageFilters {
  search?: string
  topicId?: string
  deleted?: 'true' | 'false' | ''
  page?: number
  pageSize?: number
}

export interface AdminMessageListPage {
  messages: PublicMessageWithSender[]
  topicNameById: Record<string, string>
  total: number
  page: number
  pageSize: number
}

export async function listAdminMessages(
  filters: AdminMessageFilters = {},
): Promise<AdminMessageListPage> {
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 25))
  const page = Math.max(1, Math.floor(filters.page ?? 1))
  const offset = (page - 1) * pageSize

  const client = await getServerClient()

  let countQuery = client
    .from('public_chat_messages')
    .select('id', { count: 'exact', head: true })
  let listQuery = client
    .from('public_chat_messages')
    .select(MESSAGE_SELECT)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (filters.topicId) {
    countQuery = countQuery.eq('topic_id', filters.topicId)
    listQuery = listQuery.eq('topic_id', filters.topicId)
  }
  if (filters.deleted === 'true') {
    countQuery = countQuery.eq('is_deleted', true)
    listQuery = listQuery.eq('is_deleted', true)
  } else if (filters.deleted === 'false') {
    countQuery = countQuery.eq('is_deleted', false)
    listQuery = listQuery.eq('is_deleted', false)
  }
  if (filters.search?.trim()) {
    const pattern = `%${filters.search.trim().replace(/[%_]/g, '\\$&')}%`
    countQuery = countQuery.ilike('content', pattern)
    listQuery = listQuery.ilike('content', pattern)
  }

  const [countRes, listRes, topicsRes] = await Promise.all([
    countQuery,
    listQuery,
    client.from('public_chat_topics').select('id, name'),
  ])

  const messages = (listRes.data as unknown as PublicMessageWithSender[] | null) ?? []
  const topicNameById: Record<string, string> = {}
  for (const t of (topicsRes.data ?? []) as Array<{ id: string; name: string }>) {
    topicNameById[t.id] = t.name
  }

  return {
    messages,
    topicNameById,
    total: countRes.count ?? 0,
    page,
    pageSize,
  }
}
