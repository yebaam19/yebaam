'use server'

import { getServerClient } from '@/utils/supabase/server'
import { isSpaceAdmin } from '@/app/(app)/foro/server/roles.server'
import { slugify, revalidateSpaceBySlug } from './_helpers'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const denied = { ok: false, error: 'No tienes permiso para administrar este foro.' }
const invalid = { ok: false, error: 'Revisa los datos y la categoría del foro.' }
type Client = Awaited<ReturnType<typeof getServerClient>>

async function verifiedClient() {
  const client = await getServerClient()
  const { data, error } = await client.auth.getUser()
  return error || !data.user ? null : client
}

function validName(name: string, position = 0) {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 150
    && Number.isInteger(position) && position >= 0 && position <= 100000
}

async function categorySpace(client: Client, categoryId: string) {
  const { data, error } = await client.from('forum_categories').select('space_id').eq('id', categoryId).maybeSingle()
  return error ? null : data?.space_id as string | undefined
}

function writeError(code?: string) {
  return { ok: false, error: code === '23505' ? 'Ya existe un elemento con este nombre en esta sección.' : 'No se pudo guardar el cambio. Inténtalo de nuevo.' }
}

export async function upsertCategory(input: {
  spaceId: string; categoryId?: string; name: string; position?: number
}): Promise<{ ok: boolean; error?: string }> {
  const client = await verifiedClient()
  if (!client) return denied
  if (!input || !uuid.test(input.spaceId) || !validName(input.name, input.position)
    || (input.categoryId && !uuid.test(input.categoryId))) return invalid
  if (!await isSpaceAdmin(input.spaceId)) return denied
  const patch = { name: input.name.trim(), position: input.position ?? 0 }
  if (input.categoryId) {
    // Renaming must preserve bookmarked paths and cannot move a category between spaces.
    const { data, error } = await client.from('forum_categories').update(patch)
      .eq('id', input.categoryId).eq('space_id', input.spaceId).select('id').maybeSingle()
    if (error) return writeError(error.code)
    if (!data) return invalid
  } else {
    const { error } = await client.from('forum_categories').insert({
      ...patch, space_id: input.spaceId, slug: `${input.spaceId}-${slugify(input.name).slice(0, 40)}`,
    })
    if (error) return writeError(error.code)
  }
  await revalidateSpaceBySlug(client, input.spaceId)
  return { ok: true }
}

export async function deleteCategory(categoryId: string): Promise<{ ok: boolean; error?: string }> {
  const client = await verifiedClient()
  if (!client) return denied
  if (!uuid.test(categoryId)) return invalid
  const spaceId = await categorySpace(client, categoryId)
  if (!spaceId || !await isSpaceAdmin(spaceId)) return denied
  const { data, error } = await client.from('forum_categories').delete().eq('id', categoryId).eq('space_id', spaceId).select('id').maybeSingle()
  if (error) return writeError(error.code)
  if (!data) return invalid
  await revalidateSpaceBySlug(client, spaceId)
  return { ok: true }
}

async function validParent(client: Client, categoryId: string, parentId?: string | null, forumId?: string) {
  const visited = new Set<string>()
  let next = parentId
  // Bound ancestry reads and reject cycles, including making a descendant its parent's parent.
  while (next) {
    if (next === forumId || visited.has(next) || visited.size >= 32 || !uuid.test(next)) return false
    visited.add(next)
    const { data, error } = await client.from('forums').select('category_id, parent_forum_id').eq('id', next).maybeSingle()
    if (error || !data || data.category_id !== categoryId) return false
    next = data.parent_forum_id
  }
  return true
}

export async function upsertForum(input: {
  spaceId: string; categoryId: string; parentForumId?: string | null; forumId?: string
  name: string; description?: string | null; position?: number
}): Promise<{ ok: boolean; error?: string }> {
  const client = await verifiedClient()
  if (!client) return denied
  if (!input || !uuid.test(input.spaceId) || !uuid.test(input.categoryId) || !validName(input.name, input.position)
    || (input.forumId && !uuid.test(input.forumId))
    || (input.description != null && (typeof input.description !== 'string' || input.description.length > 4000))) return invalid
  if (!await isSpaceAdmin(input.spaceId)) return denied
  if (await categorySpace(client, input.categoryId) !== input.spaceId) return invalid
  if (!await validParent(client, input.categoryId, input.parentForumId, input.forumId)) return invalid
  const patch = {
    parent_forum_id: input.parentForumId ?? null, name: input.name.trim(),
    description: input.description ?? null, position: input.position ?? 0,
  }
  if (input.forumId) {
    const { data, error } = await client.from('forums').update(patch)
      .eq('id', input.forumId).eq('category_id', input.categoryId).select('id').maybeSingle()
    if (error) return writeError(error.code)
    if (!data) return invalid
  } else {
    const { error } = await client.from('forums').insert({
      ...patch, category_id: input.categoryId, slug: `${input.categoryId}-${slugify(input.name).slice(0, 40)}`,
    })
    if (error) return writeError(error.code)
  }
  await revalidateSpaceBySlug(client, input.spaceId)
  return { ok: true }
}

export async function deleteForum(forumId: string): Promise<{ ok: boolean; error?: string }> {
  const client = await verifiedClient()
  if (!client) return denied
  if (!uuid.test(forumId)) return invalid
  const { data: forum, error: readError } = await client.from('forums').select('category_id').eq('id', forumId).maybeSingle()
  if (readError || !forum) return invalid
  const spaceId = await categorySpace(client, forum.category_id)
  if (!spaceId || !await isSpaceAdmin(spaceId)) return denied
  const { data, error } = await client.from('forums').delete().eq('id', forumId).eq('category_id', forum.category_id).select('id').maybeSingle()
  if (error) return writeError(error.code)
  if (!data) return invalid
  await revalidateSpaceBySlug(client, spaceId)
  return { ok: true }
}
