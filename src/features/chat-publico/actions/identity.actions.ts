'use server'

import { getServerClient, getServiceClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/features/auth/actions/auth.actions'
import { fetchProfileAvatarUrl } from '../lib/avatar'
import {
  getOrCreateSessionToken,
  hashSessionToken,
  writePreferredNickname,
} from '../lib/session'
import type { ChatIdentity, JoinRoomResult } from '../types'

const NICK_MIN = 2
const NICK_MAX = 24
const NICK_PATTERN = /^[\p{L}\p{N}_.\-]+$/u

function sanitizeNickname(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (trimmed.length < NICK_MIN || trimmed.length > NICK_MAX) return null
  if (!NICK_PATTERN.test(trimmed)) return null
  return trimmed
}

async function roomIsOpen(roomId: string): Promise<
  { open: true; capacity: number } | { open: false; reason: 'not_found' | 'closed' | 'archived' | 'expired' }
> {
  const client = await getServerClient()
  const { data } = await client
    .from('public_chat_topics')
    .select('id, is_archived, closed_at, expires_at, max_capacity')
    .eq('id', roomId)
    .maybeSingle()
  if (!data) return { open: false, reason: 'not_found' }
  const row = data as {
    is_archived: boolean
    closed_at: string | null
    expires_at: string | null
    max_capacity: number | null
  }
  if (row.is_archived) return { open: false, reason: 'archived' }
  if (row.closed_at) return { open: false, reason: 'closed' }
  if (row.expires_at && new Date(row.expires_at) < new Date()) return { open: false, reason: 'expired' }
  return { open: true, capacity: row.max_capacity ?? 200 }
}

async function roomHasSpace(roomId: string, capacity: number): Promise<boolean> {
  const client = await getServerClient()
  const { count } = await client
    .from('public_chat_presence')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId)
  return (count ?? 0) < capacity
}

/**
 * Join a room using the authenticated user's profile display name.
 * Requires a logged-in user — guests must pick a nickname instead.
 */
export async function joinRoomAsProfile(roomId: string): Promise<JoinRoomResult> {
  if (!roomId) return { ok: false, error: 'invalid' }
  const user = await getAuthUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const status = await roomIsOpen(roomId)
  if (!status.open) return { ok: false, error: 'room_closed' }
  if (!(await roomHasSpace(roomId, status.capacity))) {
    return { ok: false, error: 'room_full' }
  }

  const sessionToken = await getOrCreateSessionToken()
  const sessionHash = hashSessionToken(sessionToken)
  const client = await getServerClient()
  // Identity snapshot id-first: resolve the avatar from avatar_cloudflare_id
  // (legacy avatar_url fallback) instead of trusting the raw URL column.
  const avatarUrl = await fetchProfileAvatarUrl(client, user.id)
  const { error } = await client
    .from('public_chat_presence')
    .upsert(
      {
        room_id: roomId,
        user_id: user.id,
        session_hash: sessionHash,
        identity_kind: 'profile',
        display_name: user.displayName,
        avatar_url: avatarUrl,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'room_id,session_hash' },
    )
  if (error) return { ok: false, error: 'db_error', message: error.message }

  const identity: ChatIdentity = {
    kind: 'profile',
    userId: user.id,
    sessionToken,
    displayName: user.displayName,
    username: user.username,
    avatarUrl,
  }
  return { ok: true, identity }
}

/**
 * Join a room with a chosen nickname. Works for both authenticated users
 * (identity_kind='nick') and guests (identity_kind='guest'). Enforces
 * per-room uniqueness via public_chat_nicknames reservations.
 *
 * Guest writes use the service-role client because RLS only permits writes
 * from authenticated users. The session token binds the reservation so only
 * this browser can reuse the nick.
 */
export async function joinRoomAsNickname(
  roomId: string,
  rawNickname: string,
): Promise<JoinRoomResult> {
  if (!roomId) return { ok: false, error: 'invalid' }
  const nickname = sanitizeNickname(rawNickname)
  if (!nickname) return { ok: false, error: 'invalid' }

  const status = await roomIsOpen(roomId)
  if (!status.open) return { ok: false, error: 'room_closed' }

  const sessionToken = await getOrCreateSessionToken()
  const sessionHash = hashSessionToken(sessionToken)
  const user = await getAuthUser()
  const identityKind: 'nick' | 'guest' = user ? 'nick' : 'guest'

  if (!(await roomHasSpace(roomId, status.capacity))) {
    return { ok: false, error: 'room_full' }
  }

  const service = await getServiceClient()

  // 1. Claim the nickname — unique on (room_id, nickname_lower).
  const nicknameLower = nickname.toLowerCase()
  const { data: existingNick } = await service
    .from('public_chat_nicknames')
    .select('id, session_hash, user_id')
    .eq('room_id', roomId)
    .eq('nickname_lower', nicknameLower)
    .maybeSingle()

  if (existingNick) {
    const row = existingNick as { session_hash: string; user_id: string | null }
    const mine =
      row.session_hash === sessionHash || (user && row.user_id === user.id)
    if (!mine) return { ok: false, error: 'nickname_taken' }
  } else {
    const { error: reserveError } = await service
      .from('public_chat_nicknames')
      .insert({
        room_id: roomId,
        nickname_lower: nicknameLower,
        nickname_display: nickname,
        user_id: user?.id ?? null,
        session_hash: sessionHash,
      })
    if (reserveError) {
      // Unique violation = race lost to another claimer.
      if (reserveError.code === '23505') {
        return { ok: false, error: 'nickname_taken' }
      }
      return { ok: false, error: 'db_error', message: reserveError.message }
    }
  }

  // Identity snapshot id-first (see joinRoomAsProfile). Guests have no avatar.
  const avatarUrl = user ? await fetchProfileAvatarUrl(service, user.id) : null

  // 2. Upsert the presence row.
  const { error: presenceError } = await service
    .from('public_chat_presence')
    .upsert(
      {
        room_id: roomId,
        user_id: user?.id ?? null,
        session_hash: sessionHash,
        identity_kind: identityKind,
        display_name: nickname,
        avatar_url: avatarUrl,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'room_id,session_hash' },
    )
  if (presenceError) {
    return { ok: false, error: 'db_error', message: presenceError.message }
  }

  await writePreferredNickname(nickname)

  const identity: ChatIdentity =
    identityKind === 'nick' && user
      ? {
          kind: 'nick',
          userId: user.id,
          sessionToken,
          nickname,
          avatarUrl,
        }
      : {
          kind: 'guest',
          sessionToken,
          nickname,
        }
  return { ok: true, identity }
}

/** Refresh last_seen_at so cleanup jobs don't evict this session. */
export async function heartbeatPresence(roomId: string): Promise<{ ok: boolean }> {
  if (!roomId) return { ok: false }
  const sessionToken = await getOrCreateSessionToken()
  const sessionHash = hashSessionToken(sessionToken)
  const service = await getServiceClient()
  const { error } = await service
    .from('public_chat_presence')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('session_hash', sessionHash)
  return { ok: !error }
}

/** Remove the caller's presence row (manual leave / unmount). */
export async function leaveRoom(roomId: string): Promise<{ ok: boolean }> {
  if (!roomId) return { ok: false }
  const sessionToken = await getOrCreateSessionToken()
  const sessionHash = hashSessionToken(sessionToken)
  const service = await getServiceClient()
  const { error } = await service
    .from('public_chat_presence')
    .delete()
    .eq('room_id', roomId)
    .eq('session_hash', sessionHash)
  return { ok: !error }
}
