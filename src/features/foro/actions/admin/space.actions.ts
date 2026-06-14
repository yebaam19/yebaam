'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import type { ForoAuthor, ForoRoleType, OwnerType, SpaceVisibility } from '@/features/foro/types'
import {
  slugify,
  deriveDisplayName,
  ensureUniqueSpaceSlug,
  resolveOwner,
} from './_helpers'

// --------- Platform admin actions ---------

export async function enableForumForOwner(input: {
  ownerType: OwnerType
  ownerId: string
}): Promise<{ ok: boolean; error?: string; spaceSlug?: string }> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return { ok: false, error: 'No autenticado.' }

  // Reactivate if a space already exists
  const { data: existing } = await client
    .from('forum_spaces')
    .select('id, slug, enabled')
    .eq('owner_type', input.ownerType)
    .eq('owner_id', input.ownerId)
    .maybeSingle()
  if (existing) {
    if (!(existing as { enabled: boolean }).enabled) {
      const { error } = await client
        .from('forum_spaces')
        .update({ enabled: true })
        .eq('id', (existing as { id: string }).id)
      if (error) return { ok: false, error: error.message }
    }
    revalidatePath('/admin/foros')
    return { ok: true, spaceSlug: (existing as { slug: string }).slug }
  }

  const owner = await resolveOwner(client, input.ownerType, input.ownerId)
  if (!owner) return { ok: false, error: 'Perfil no encontrado.' }

  const baseSlug = slugify(`${input.ownerType}-${owner.slug ?? owner.name}`)
  const spaceSlug = await ensureUniqueSpaceSlug(client, baseSlug)

  const { data: space, error: spaceError } = await client
    .from('forum_spaces')
    .insert({
      owner_type: input.ownerType,
      owner_id: input.ownerId,
      slug: spaceSlug,
      name: owner.name,
      visibility: owner.privacy,
      enabled: true,
      enabled_by: auth.user.id,
    })
    .select('id, slug')
    .single()
  if (spaceError || !space) return { ok: false, error: spaceError?.message ?? 'No se pudo crear.' }

  // Seed default General category
  await client.from('forum_categories').insert({
    space_id: (space as { id: string }).id,
    name: 'General',
    slug: 'general',
    position: 0,
  })

  // Grant owner admin role
  if (owner.ownerUserId) {
    await client.from('forum_roles').insert({
      space_id: (space as { id: string }).id,
      user_id: owner.ownerUserId,
      role: 'admin',
      granted_by: auth.user.id,
    })
  }

  revalidatePath('/admin/foros')
  return { ok: true, spaceSlug: (space as { slug: string }).slug }
}

export async function disableForumSpace(
  spaceId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client
    .from('forum_spaces')
    .update({ enabled: false })
    .eq('id', spaceId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/foros')
  return { ok: true }
}

export async function disableForumSpaceBySlug(
  slug: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client
    .from('forum_spaces')
    .update({ enabled: false })
    .eq('slug', slug)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/foros')
  return { ok: true }
}

export async function grantForumStaffByUsername(
  username: string,
  role: ForoRoleType,
): Promise<{ ok: boolean; error?: string; user?: ForoAuthor }> {
  if (role !== 'admin' && role !== 'moderator') {
    return { ok: false, error: 'Rol no válido.' }
  }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return { ok: false, error: 'No autenticado.' }
  const { data: profile } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, display_name, avatar_url')
    .eq('username', username)
    .maybeSingle()
  if (!profile) return { ok: false, error: 'Usuario no encontrado.' }
  const p = profile as {
    id: string
    username: string | null
    first_name: string | null
    last_name: string | null
    display_name: string | null
    avatar_url: string | null
  }
  const { error } = await client
    .from('forum_global_roles')
    .upsert({ user_id: p.id, role, granted_by: auth.user.id }, { onConflict: 'user_id' })
  if (error) return { ok: false, error: error.message }
  const displayName = deriveDisplayName(p, 'Usuario')
  revalidatePath('/admin/foros')
  return {
    ok: true,
    user: {
      id: p.id,
      username: p.username ?? 'usuario',
      displayName,
      avatarUrl: p.avatar_url,
    },
  }
}

export async function revokeForumStaff(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client.from('forum_global_roles').delete().eq('user_id', userId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/foros')
  return { ok: true }
}

// --------- Space admin actions ---------

export async function updateSpace(input: {
  spaceId: string
  name?: string
  description?: string | null
  visibility?: SpaceVisibility
  enabled?: boolean
}): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const payload: Record<string, unknown> = {}
  if (input.name !== undefined) payload.name = input.name
  if (input.description !== undefined) payload.description = input.description
  if (input.visibility !== undefined) payload.visibility = input.visibility
  if (input.enabled !== undefined) payload.enabled = input.enabled
  const { data: space, error } = await client
    .from('forum_spaces')
    .update(payload)
    .eq('id', input.spaceId)
    .select('slug')
    .single()
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/foro/${(space as { slug: string }).slug}`)
  revalidatePath(`/foro/${(space as { slug: string }).slug}/admin`)
  return { ok: true }
}
