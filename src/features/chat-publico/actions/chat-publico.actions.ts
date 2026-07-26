'use server'

import { getServerClient, getServiceClient } from '@/utils/supabase/server'
import { ensureBlogChatTopic, getBlogOwnerId } from '@/lib/api/blogs'
import { getRoomIdentity } from '../lib/identity'
import { hashSessionToken } from '../lib/session'
import { capabilitiesFor } from '../lib/permissions'
import type { SendPublicMessageResult, SoftDeletePublicMessageResult } from '../types'

/**
 * Provisions (or finds) the public-chat topic for a blog and returns its slug
 * so the caller can route to `/feed/chat-publico/<topicSlug>`.
 *
 * Takes only the blog id: ownership is decided against the blog row's own
 * `owner_id`, and the topic's name/slug are derived from that row rather than
 * from the caller, so a topic cannot be spawned for someone else's blog nor
 * named by whoever calls the action.
 */
export async function ensureBlogChatTopicAction(
  blogId: string,
): Promise<{ topicSlug: string } | null> {
  if (!blogId) return null
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return null

  const ownerId = await getBlogOwnerId(blogId)
  if (!ownerId || ownerId !== auth.user.id) return null

  const result = await ensureBlogChatTopic(blogId)
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

/**
 * Identity-aware send. Resolves the caller's room identity (profile / nick /
 * guest) and writes the message with the appropriate sender fields.
 *
 * Guest and nick writes use the service-role client since existing RLS only
 * permits authenticated inserts. The session token ties the write back to
 * the browser session that claimed the nickname.
 */
export async function sendChatMessage(
  roomId: string,
  rawContent: string,
): Promise<SendPublicMessageResult> {
  const content = typeof rawContent === 'string' ? rawContent.trim() : ''
  if (!roomId || typeof roomId !== 'string') return { ok: false, error: 'invalid' }
  if (!content || content.length > MAX_CONTENT_LENGTH) return { ok: false, error: 'invalid' }

  const identity = await getRoomIdentity(roomId)
  if (!identity) return { ok: false, error: 'unauthorized' }

  const caps = capabilitiesFor(identity)
  if (!caps.canChat) return { ok: false, error: 'unauthorized' }

  // Rate limit: 5 messages / 10s per session (covers all identity kinds).
  const service = await getServiceClient()
  const sessionHash = hashSessionToken(identity.sessionToken)
  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  const { data: recent } = await service
    .from('public_chat_messages')
    .select('created_at')
    .eq('session_hash', sessionHash)
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

  const senderKind = identity.kind
  const senderUserId = identity.kind === 'guest' ? null : identity.userId
  const senderNickname =
    identity.kind === 'profile' ? identity.displayName : identity.nickname
  const senderAvatar =
    identity.kind === 'guest' ? null : identity.avatarUrl ?? null

  const { data, error } = await service
    .from('public_chat_messages')
    .insert({
      topic_id: roomId,
      sender_id: senderUserId,
      sender_kind: senderKind,
      sender_nickname: senderNickname,
      sender_avatar_url: senderAvatar,
      session_hash: sessionHash,
      content,
    })
    .select('id')
    .maybeSingle()

  if (error) {
    if (error.message?.toLowerCase().includes('rate_limited')) {
      return { ok: false, error: 'rate_limited', retryAfterMs: WINDOW_MS }
    }
    return { ok: false, error: 'db_error', message: error.message }
  }
  return { ok: true, messageId: (data as { id: string } | null)?.id }
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
