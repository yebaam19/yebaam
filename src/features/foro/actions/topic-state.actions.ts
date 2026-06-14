'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { lookupForumPath, lookupTopicPath } from './_helpers'

export async function deleteTopic(topicId: string): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const path = await lookupTopicPath(client, topicId)
  const { error } = await client.from('forum_topics').delete().eq('id', topicId)
  if (error) return { ok: false, error: error.message }
  if (path) revalidatePath(`/foro/${path.space_slug}/${path.forum_slug}`)
  return { ok: true }
}

export async function setTopicPinned(
  topicId: string,
  pinned: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client
    .from('forum_topics')
    .update({ is_pinned: pinned })
    .eq('id', topicId)
  if (error) return { ok: false, error: error.message }
  const path = await lookupTopicPath(client, topicId)
  if (path) revalidatePath(`/foro/${path.space_slug}/${path.forum_slug}`)
  return { ok: true }
}

export async function setTopicLocked(
  topicId: string,
  locked: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client
    .from('forum_topics')
    .update({ is_locked: locked })
    .eq('id', topicId)
  if (error) return { ok: false, error: error.message }
  const path = await lookupTopicPath(client, topicId)
  if (path) revalidatePath(`/foro/${path.space_slug}/${path.forum_slug}/${path.topic_slug}`)
  return { ok: true }
}

export async function moveTopic(
  topicId: string,
  targetForumId: string,
): Promise<{ ok: boolean; error?: string; spaceSlug?: string; forumSlug?: string; topicSlug?: string }> {
  const client = await getServerClient()

  const { data: topic } = await client
    .from('forum_topics')
    .select('id, slug, forum_id')
    .eq('id', topicId)
    .maybeSingle()
  if (!topic) return { ok: false, error: 'Tema no encontrado.' }
  const sourceForumId = (topic as { forum_id: string }).forum_id
  if (sourceForumId === targetForumId) return { ok: true }

  // Both forums must be in the same space
  const { data: source } = await client
    .from('forums')
    .select('category_id, forum_categories:category_id(space_id)')
    .eq('id', sourceForumId)
    .maybeSingle()
  const { data: target } = await client
    .from('forums')
    .select('category_id, forum_categories:category_id(space_id)')
    .eq('id', targetForumId)
    .maybeSingle()
  type Linked = { forum_categories: { space_id: string } | { space_id: string }[] | null }
  const sourceSpace = (() => {
    if (!source) return null
    const c = (source as Linked).forum_categories
    const row = Array.isArray(c) ? c[0] : c
    return row?.space_id ?? null
  })()
  const targetSpace = (() => {
    if (!target) return null
    const c = (target as Linked).forum_categories
    const row = Array.isArray(c) ? c[0] : c
    return row?.space_id ?? null
  })()
  if (!sourceSpace || sourceSpace !== targetSpace) {
    return { ok: false, error: 'No puedes mover el tema a otro foro.' }
  }

  const { error: updError } = await client
    .from('forum_topics')
    .update({ forum_id: targetForumId })
    .eq('id', topicId)
  if (updError) return { ok: false, error: updError.message }

  // Insert redirect row
  await client.from('forum_topic_redirects').upsert({
    old_forum_id: sourceForumId,
    old_slug: (topic as { slug: string }).slug,
    topic_id: topicId,
  })

  const targetPath = await lookupForumPath(client, targetForumId)
  if (targetPath) {
    revalidatePath(`/foro/${targetPath.space_slug}/${targetPath.forum_slug}`)
    return {
      ok: true,
      spaceSlug: targetPath.space_slug,
      forumSlug: targetPath.forum_slug,
      topicSlug: (topic as { slug: string }).slug,
    }
  }
  return { ok: true }
}
