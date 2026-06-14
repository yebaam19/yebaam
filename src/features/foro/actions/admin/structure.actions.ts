'use server'

import { getServerClient } from '@/utils/supabase/server'
import { slugify, revalidateSpaceBySlug } from './_helpers'

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
  await revalidateSpaceBySlug(client, input.spaceId)
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
  await revalidateSpaceBySlug(client, input.spaceId)
  return { ok: true }
}

export async function deleteForum(forumId: string): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client.from('forums').delete().eq('id', forumId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
