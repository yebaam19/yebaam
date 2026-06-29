import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions'

/**
 * Forum authorization checks: per-space roles, global forum staff, and platform
 * admins. Used by the forum pages, the (protected) admin layout, and a handful
 * of cross-feature gates (e.g. `@/features/admin/server/auth`).
 */

/**
 * Shared space-role check. `adminOnly` narrows the space-role query to the
 * 'admin' role (and the global-role fallback to 'admin'); otherwise any space
 * role / any global role passes. Platform admins always pass.
 */
async function hasSpaceRole(spaceId: string, adminOnly: boolean): Promise<boolean> {
  const user = await getCachedAuthUser()
  if (!user) return false
  const client = await getServerClient()
  let query = client
    .from('forum_roles')
    .select('role')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
  if (adminOnly) query = query.eq('role', 'admin')
  const { data } = await query.limit(1)
  if ((data?.length ?? 0) > 0) return true
  const global = await getForumGlobalRole()
  if (adminOnly ? global === 'admin' : Boolean(global)) return true
  return isPlatformAdmin()
}

export async function isSpaceAdmin(spaceId: string): Promise<boolean> {
  return hasSpaceRole(spaceId, true)
}

export async function isSpaceModerator(spaceId: string): Promise<boolean> {
  return hasSpaceRole(spaceId, false)
}

export const isPlatformAdmin = cache(async (): Promise<boolean> => {
  const user = await getCachedAuthUser()
  if (!user) return false
  const client = await getServerClient()
  const { data } = await client
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return !!data
})

export const getForumGlobalRole = cache(async (): Promise<'admin' | 'moderator' | null> => {
  const user = await getCachedAuthUser()
  if (!user) return null
  const client = await getServerClient()
  const { data } = await client
    .from('forum_global_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()
  return (data as { role: 'admin' | 'moderator' } | null)?.role ?? null
})

export async function canAccessForumAdmin(): Promise<boolean> {
  if (await isPlatformAdmin()) return true
  return (await getForumGlobalRole()) !== null
}
