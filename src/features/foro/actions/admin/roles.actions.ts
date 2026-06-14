'use server'

import { getServerClient } from '@/utils/supabase/server'

export async function addForumRole(input: {
  spaceId: string
  username: string
  role: 'admin' | 'moderator'
}): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { data: profile } = await client
    .from('profiles')
    .select('id')
    .eq('username', input.username)
    .maybeSingle()
  if (!profile) return { ok: false, error: 'Usuario no encontrado.' }
  const { data: auth } = await client.auth.getUser()
  const { error } = await client.from('forum_roles').upsert({
    space_id: input.spaceId,
    user_id: (profile as { id: string }).id,
    role: input.role,
    granted_by: auth?.user?.id ?? null,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function removeForumRole(input: {
  spaceId: string
  userId: string
}): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client
    .from('forum_roles')
    .delete()
    .eq('space_id', input.spaceId)
    .eq('user_id', input.userId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
