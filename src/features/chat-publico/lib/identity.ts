import 'server-only'

import { getServerClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/features/auth/actions/auth.actions'
import { fetchProfileAvatarUrl } from './avatar'
import { hashSessionToken, readSessionToken } from './session'
import type { ChatIdentity } from '../types'

/**
 * Resolves the caller's identity inside a room. Returns null when the caller
 * has not joined yet (no presence row for this session + room) — the page
 * should render the entry gate in that case.
 *
 * Resolution order:
 *   1. If a presence row exists for (room_id, session_token), use it.
 *   2. Otherwise return null (user must pick an identity via the gate).
 */
export async function getRoomIdentity(roomId: string): Promise<ChatIdentity | null> {
  const sessionToken = await readSessionToken()
  if (!sessionToken) return null
  const sessionHash = hashSessionToken(sessionToken)

  const client = await getServerClient()
  const { data: presence } = await client
    .from('public_chat_presence')
    .select('id, user_id, identity_kind, display_name, avatar_url')
    .eq('room_id', roomId)
    .eq('session_hash', sessionHash)
    .maybeSingle()

  if (!presence) return null

  const p = presence as {
    user_id: string | null
    identity_kind: 'profile' | 'nick' | 'guest'
    display_name: string
    avatar_url: string | null
  }

  if (p.identity_kind === 'profile' && p.user_id) {
    const user = await getAuthUser()
    if (!user || user.id !== p.user_id) return null
    return {
      kind: 'profile',
      userId: user.id,
      sessionToken,
      displayName: user.displayName,
      username: user.username,
      // id-first: this feeds the sender_avatar_url snapshot on every message,
      // so resolve from avatar_cloudflare_id (legacy avatar_url fallback).
      avatarUrl: await fetchProfileAvatarUrl(client, user.id),
    }
  }
  if (p.identity_kind === 'nick' && p.user_id) {
    return {
      kind: 'nick',
      userId: p.user_id,
      sessionToken,
      nickname: p.display_name,
      avatarUrl: p.avatar_url,
    }
  }
  return {
    kind: 'guest',
    sessionToken,
    nickname: p.display_name,
  }
}
