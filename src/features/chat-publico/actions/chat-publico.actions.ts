'use server'

import { getServerClient } from '@/utils/supabase/server'
import { ensureBlogChatTopic } from '@/lib/api/blogs'
import type { SendPublicMessageResult, SoftDeletePublicMessageResult } from '../types'

/**
 * Provisions (or finds) the public-chat topic for a blog and returns its slug
 * so the caller can route to `/feed/chat-publico/<topicSlug>`.
 * Owner-gated to prevent random users from spawning topics.
 */
export async function ensureBlogChatTopicAction(blog: {
  id: string
  name: string
  slug: string
  ownerId: string
}): Promise<{ topicSlug: string } | null> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user || auth.user.id !== blog.ownerId) return null
  const result = await ensureBlogChatTopic({ id: blog.id, name: blog.name, slug: blog.slug })
  if (!result) return null
  return { topicSlug: result.topicSlug }
}

const MAX_CONTENT_LENGTH = 2000
const WINDOW_MS = 10_000
const MAX_PER_WINDOW = 5
const MIN_GAP_MS = 1_500

export async function sendPublicMessage(
  rawContent: string,
  topicId: string,
): Promise<SendPublicMessageResult> {
  const content = typeof rawContent === 'string' ? rawContent.trim() : ''
  if (!content || content.length > MAX_CONTENT_LENGTH) {
    return { ok: false, error: 'invalid' }
  }
  if (!topicId || typeof topicId !== 'string') {
    return { ok: false, error: 'invalid' }
  }

  const client = await getServerClient()
  const { data: authResponse } = await client.auth.getUser()
  const user = authResponse?.user
  if (!user) return { ok: false, error: 'unauthorized' }

  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  const { data: recent } = await client
    .from('public_chat_messages')
    .select('created_at')
    .eq('sender_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(MAX_PER_WINDOW)

  if (recent && recent.length >= MAX_PER_WINDOW) {
    const oldestTs = new Date(recent[recent.length - 1].created_at as string).getTime()
    const retryAfterMs = Math.max(0, WINDOW_MS - (Date.now() - oldestTs))
    return { ok: false, error: 'rate_limited', retryAfterMs }
  }
  if (recent && recent[0]) {
    const gap = Date.now() - new Date(recent[0].created_at as string).getTime()
    if (gap < MIN_GAP_MS) {
      return { ok: false, error: 'rate_limited', retryAfterMs: MIN_GAP_MS - gap }
    }
  }

  const { error } = await client
    .from('public_chat_messages')
    .insert({ sender_id: user.id, content, topic_id: topicId })

  if (error) {
    if (error.message?.toLowerCase().includes('rate_limited')) {
      return { ok: false, error: 'rate_limited', retryAfterMs: WINDOW_MS }
    }
    return { ok: false, error: 'db_error', message: error.message }
  }
  return { ok: true }
}

export async function softDeletePublicMessage(id: string): Promise<SoftDeletePublicMessageResult> {
  if (!id || typeof id !== 'string') return { ok: false, error: 'forbidden' }

  const client = await getServerClient()
  const { data: authResponse } = await client.auth.getUser()
  const user = authResponse?.user
  if (!user) return { ok: false, error: 'unauthorized' }

  const { error, data } = await client
    .from('public_chat_messages')
    .update({ is_deleted: true })
    .eq('id', id)
    .eq('sender_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, error: 'db_error', message: error.message }
  if (!data) return { ok: false, error: 'forbidden' }
  return { ok: true }
}
