'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'

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
      .slice(0, 80) || 'tema'
  )
}

async function uniqueTopicSlug(
  client: Awaited<ReturnType<typeof getServerClient>>,
  forumId: string,
  base: string,
): Promise<string> {
  let candidate = base
  let n = 1
  while (n < 50) {
    const { data } = await client
      .from('forum_topics')
      .select('id')
      .eq('forum_id', forumId)
      .eq('slug', candidate)
      .maybeSingle()
    if (!data) return candidate
    n += 1
    candidate = `${base}-${n}`
  }
  return `${base}-${Date.now()}`
}

type SpaceLookup = { space_slug: string; forum_slug: string; topic_slug?: string } | null

async function lookupTopicPath(
  client: Awaited<ReturnType<typeof getServerClient>>,
  topicId: string,
): Promise<SpaceLookup> {
  const { data } = await client
    .from('forum_topics')
    .select('slug, forums:forum_id(slug, forum_categories:category_id(forum_spaces:space_id(slug)))')
    .eq('id', topicId)
    .maybeSingle()
  if (!data) return null
  const topicSlug = (data as { slug: string }).slug
  type Nested = {
    slug: string
    forum_categories:
      | { forum_spaces: { slug: string } | { slug: string }[] | null }
      | { forum_spaces: { slug: string } | { slug: string }[] | null }[]
      | null
  }
  const f = (data as { forums: Nested | Nested[] | null }).forums
  const forum = Array.isArray(f) ? f[0] : f
  if (!forum) return null
  const cats = forum.forum_categories
  const cat = Array.isArray(cats) ? cats[0] : cats
  if (!cat) return null
  const spaces = cat.forum_spaces
  const space = Array.isArray(spaces) ? spaces[0] : spaces
  if (!space) return null
  return { space_slug: space.slug, forum_slug: forum.slug, topic_slug: topicSlug }
}

async function lookupForumPath(
  client: Awaited<ReturnType<typeof getServerClient>>,
  forumId: string,
): Promise<{ space_slug: string; forum_slug: string } | null> {
  const { data } = await client
    .from('forums')
    .select('slug, forum_categories:category_id(forum_spaces:space_id(slug))')
    .eq('id', forumId)
    .maybeSingle()
  if (!data) return null
  type Nested = {
    slug: string
    forum_categories:
      | { forum_spaces: { slug: string } | { slug: string }[] | null }
      | { forum_spaces: { slug: string } | { slug: string }[] | null }[]
      | null
  }
  const d = data as Nested
  const cat = Array.isArray(d.forum_categories) ? d.forum_categories[0] : d.forum_categories
  if (!cat) return null
  const space = Array.isArray(cat.forum_spaces) ? cat.forum_spaces[0] : cat.forum_spaces
  if (!space) return null
  return { space_slug: space.slug, forum_slug: d.slug }
}

export interface CreateTopicInput {
  forumId: string
  title: string
  content: string
}

export interface CreateTopicResult {
  ok: boolean
  error?: string
  spaceSlug?: string
  forumSlug?: string
  topicSlug?: string
}

export async function createTopic(input: CreateTopicInput): Promise<CreateTopicResult> {
  const title = input.title.trim()
  const content = input.content.trim()
  if (!title) return { ok: false, error: 'El título es obligatorio.' }
  if (!content) return { ok: false, error: 'El contenido es obligatorio.' }

  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return { ok: false, error: 'Debes iniciar sesión.' }

  const forumPath = await lookupForumPath(client, input.forumId)
  if (!forumPath) return { ok: false, error: 'Foro no encontrado.' }

  const slug = await uniqueTopicSlug(client, input.forumId, slugify(title))

  const { data: topic, error: topicError } = await client
    .from('forum_topics')
    .insert({ forum_id: input.forumId, author_id: auth.user.id, title, slug })
    .select('id, slug')
    .single()
  if (topicError || !topic) {
    return { ok: false, error: topicError?.message ?? 'No se pudo crear el tema.' }
  }

  const { error: postError } = await client.from('forum_posts').insert({
    topic_id: topic.id,
    author_id: auth.user.id,
    content,
  })
  if (postError) return { ok: false, error: postError.message }

  revalidatePath(`/foro/${forumPath.space_slug}`)
  revalidatePath(`/foro/${forumPath.space_slug}/${forumPath.forum_slug}`)
  return {
    ok: true,
    spaceSlug: forumPath.space_slug,
    forumSlug: forumPath.forum_slug,
    topicSlug: topic.slug,
  }
}

export async function createPost(input: {
  topicId: string
  content: string
}): Promise<{ ok: boolean; error?: string }> {
  const content = input.content.trim()
  if (!content) return { ok: false, error: 'El mensaje no puede estar vacío.' }

  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return { ok: false, error: 'Debes iniciar sesión.' }

  const { error } = await client.from('forum_posts').insert({
    topic_id: input.topicId,
    author_id: auth.user.id,
    content,
  })
  if (error) return { ok: false, error: error.message }

  const path = await lookupTopicPath(client, input.topicId)
  if (path) {
    revalidatePath(`/foro/${path.space_slug}/${path.forum_slug}`)
    revalidatePath(`/foro/${path.space_slug}/${path.forum_slug}/${path.topic_slug}`)
  }
  return { ok: true }
}

export async function deletePost(postId: string): Promise<{ ok: boolean; error?: string }> {
  const client = await getServerClient()
  const { error } = await client.from('forum_posts').delete().eq('id', postId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

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
