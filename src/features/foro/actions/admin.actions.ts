'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import type { ForoAuthor, OwnerType, SpaceVisibility } from '@/features/foro/types'

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80) || 'espacio'
  )
}

function normalizeVisibility(raw: string | null | undefined): SpaceVisibility {
  const v = (raw ?? 'public').toLowerCase()
  if (v === 'private') return 'private'
  if (v === 'secret') return 'secret'
  return 'public'
}

async function ensureUniqueSpaceSlug(
  client: Awaited<ReturnType<typeof getServerClient>>,
  base: string,
): Promise<string> {
  let candidate = base
  let n = 1
  while (n < 100) {
    const { data } = await client
      .from('forum_spaces')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    if (!data) return candidate
    n += 1
    candidate = `${base}-${n}`
  }
  return `${base}-${Date.now()}`
}

async function resolveOwner(
  client: Awaited<ReturnType<typeof getServerClient>>,
  ownerType: OwnerType,
  ownerId: string,
): Promise<{ name: string; slug: string | null; privacy: SpaceVisibility; ownerUserId: string | null } | null> {
  switch (ownerType) {
    case 'club': {
      const { data } = await client
        .from('clubs')
        .select('name, slug, privacy, owner_id')
        .eq('id', ownerId)
        .maybeSingle()
      if (!data) return null
      return {
        name: (data as { name: string }).name,
        slug: (data as { slug: string | null }).slug ?? null,
        privacy: normalizeVisibility((data as { privacy: string | null }).privacy),
        ownerUserId: (data as { owner_id: string | null }).owner_id ?? null,
      }
    }
    case 'group': {
      const { data } = await client
        .from('groups')
        .select('name, privacy, creator_id')
        .eq('id', ownerId)
        .maybeSingle()
      if (!data) return null
      return {
        name: (data as { name: string }).name,
        slug: null,
        privacy: normalizeVisibility((data as { privacy: string | null }).privacy),
        ownerUserId: (data as { creator_id: string | null }).creator_id ?? null,
      }
    }
    case 'page': {
      const { data } = await client
        .from('pages')
        .select('name, slug, privacy, owner_id')
        .eq('id', ownerId)
        .maybeSingle()
      if (!data) return null
      return {
        name: (data as { name: string }).name,
        slug: (data as { slug: string | null }).slug ?? null,
        privacy: normalizeVisibility((data as { privacy: string | null }).privacy),
        ownerUserId: (data as { owner_id: string | null }).owner_id ?? null,
      }
    }
    case 'blog': {
      const { data } = await client
        .from('blogs')
        .select('name, slug, owner_id')
        .eq('id', ownerId)
        .maybeSingle()
      if (!data) return null
      return {
        name: (data as { name: string }).name,
        slug: (data as { slug: string | null }).slug ?? null,
        privacy: 'public',
        ownerUserId: (data as { owner_id: string | null }).owner_id ?? null,
      }
    }
    default:
      return null
  }
}

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

export async function grantPlatformAdmin(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client.from('platform_admins').insert({ user_id: userId })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/foros')
  return { ok: true }
}

export async function grantPlatformAdminByUsername(
  username: string,
): Promise<{ ok: boolean; error?: string; user?: ForoAuthor }> {
  const client = await getServerClient()
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
  const { error } = await client.from('platform_admins').insert({ user_id: p.id })
  if (error && !error.message.includes('duplicate')) {
    return { ok: false, error: error.message }
  }
  const displayName =
    p.display_name ||
    [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
    p.username ||
    'Usuario'
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

export async function revokePlatformAdmin(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client.from('platform_admins').delete().eq('user_id', userId)
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

export async function upsertCategory(input: {
  spaceId: string
  categoryId?: string
  name: string
  position?: number
}): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const slug = slugify(input.name)
  if (input.categoryId) {
    const { error } = await client
      .from('forum_categories')
      .update({ name: input.name, slug, position: input.position ?? 0 })
      .eq('id', input.categoryId)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await client.from('forum_categories').insert({
      space_id: input.spaceId,
      name: input.name,
      slug,
      position: input.position ?? 0,
    })
    if (error) return { ok: false, error: error.message }
  }
  const { data: space } = await client
    .from('forum_spaces')
    .select('slug')
    .eq('id', input.spaceId)
    .maybeSingle()
  if (space) revalidatePath(`/foro/${(space as { slug: string }).slug}`)
  return { ok: true }
}

export async function deleteCategory(
  categoryId: string,
): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client.from('forum_categories').delete().eq('id', categoryId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function upsertForum(input: {
  spaceId: string
  categoryId: string
  parentForumId?: string | null
  forumId?: string
  name: string
  description?: string | null
  position?: number
}): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const slug = slugify(input.name)
  if (input.forumId) {
    const { error } = await client
      .from('forums')
      .update({
        category_id: input.categoryId,
        parent_forum_id: input.parentForumId ?? null,
        name: input.name,
        description: input.description ?? null,
        slug,
        position: input.position ?? 0,
      })
      .eq('id', input.forumId)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await client.from('forums').insert({
      category_id: input.categoryId,
      parent_forum_id: input.parentForumId ?? null,
      name: input.name,
      description: input.description ?? null,
      slug,
      position: input.position ?? 0,
    })
    if (error) return { ok: false, error: error.message }
  }
  const { data: space } = await client
    .from('forum_spaces')
    .select('slug')
    .eq('id', input.spaceId)
    .maybeSingle()
  if (space) revalidatePath(`/foro/${(space as { slug: string }).slug}`)
  return { ok: true }
}

export async function deleteForum(forumId: string): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client.from('forums').delete().eq('id', forumId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

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
