import type { getServerClient } from '@/utils/supabase/server'
import { hasMusicArchiveAdminAccess } from '../../server/music-authorization.server'

type SessionClient = Awaited<ReturnType<typeof getServerClient>>

export async function isMusicArchiveAdmin(client: SessionClient, userId: string): Promise<boolean> {
  return (await hasMusicArchiveAdminAccess(client, userId)).allowed
}

/** Enforce that the user is a member of every club in `clubIds` (caller must
 *  have already let archive admins bypass this). Returns an error string when
 *  one or more clubs are off-limits, or null when all are allowed. */
export async function assertClubMembership(
  client: SessionClient,
  userId: string,
  clubIds: string[]
): Promise<string | null> {
  const { data: cm } = await client.from('club_members').select('club_id').eq('user_id', userId).in('club_id', clubIds)
  const allowed = new Set(((cm ?? []) as Array<{ club_id: string }>).map((r) => r.club_id))
  const denied = clubIds.filter((id) => !allowed.has(id))
  if (denied.length > 0) {
    return 'No eres miembro de uno o más clubes seleccionados.'
  }
  return null
}
