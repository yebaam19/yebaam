import 'server-only'

import { getServerClient } from '@/utils/supabase/server'
import type { RoomPresenceRow } from '../types'

/**
 * Returns the currently-online participants for a room. The cutoff (seen in
 * the last N seconds) acts as an auto-timeout so clients that never disconnect
 * cleanly don't stay in the list forever.
 */
export async function listRoomPresence(
  roomId: string,
  activeWithinSeconds = 120,
): Promise<RoomPresenceRow[]> {
  if (!roomId) return []
  const client = await getServerClient()
  const cutoff = new Date(Date.now() - activeWithinSeconds * 1000).toISOString()
  const { data } = await client
    .from('public_chat_presence')
    .select(
      'id, room_id, user_id, session_hash, identity_kind, display_name, avatar_url, joined_at, last_seen_at, is_muted',
    )
    .eq('room_id', roomId)
    .gte('last_seen_at', cutoff)
    .order('joined_at', { ascending: true })
    .limit(250)
  return (data as RoomPresenceRow[] | null) ?? []
}
