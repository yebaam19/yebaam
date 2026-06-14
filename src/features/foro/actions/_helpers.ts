import type { getServerClient } from '@/utils/supabase/server'

export function slugify(input: string): string {
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

export async function uniqueTopicSlug(
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

export type SpaceLookup = { space_slug: string; forum_slug: string; topic_slug?: string } | null

export async function lookupTopicPath(
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

export async function lookupForumPath(
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
