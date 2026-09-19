import { getServerClient } from '@/utils/supabase/server'
import 'server-only'

type ServerClient = Awaited<ReturnType<typeof getServerClient>>

export interface MusicArchiveAdminSession {
  userId: string
  client: ServerClient
  isPlatformAdmin: boolean
}

/** Platform admins and explicitly assigned music editors may manage the archive. */
export async function hasMusicArchiveAdminAccess(
  client: ServerClient,
  userId: string
): Promise<{ allowed: boolean; isPlatformAdmin: boolean }> {
  const [{ data: platformAdmin }, { data: musicEditor }] = await Promise.all([
    client.from('platform_admins').select('user_id').eq('user_id', userId).maybeSingle(),
    client.from('music_archive_editors').select('user_id').eq('user_id', userId).maybeSingle(),
  ])

  return {
    allowed: Boolean(platformAdmin || musicEditor),
    isPlatformAdmin: Boolean(platformAdmin),
  }
}

export async function requireMusicArchiveAdmin(): Promise<MusicArchiveAdminSession | null> {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) return null

  const access = await hasMusicArchiveAdminAccess(client, data.user.id)
  if (!access.allowed) return null

  return {
    userId: data.user.id,
    client,
    isPlatformAdmin: access.isPlatformAdmin,
  }
}
