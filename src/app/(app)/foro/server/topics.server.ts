import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import { type ProfileRow, loadProfiles, toAuthor } from './_profile-row'
import { getForumByslugInSpace, getSpaceBySlug } from './spaces.server'
import type { ForoForum, ForoSpace, ForoTopic } from '@/features/foro/types'

/**
 * Forum topics: listing within a forum (with sticky/regular pagination), single
 * topic resolution (incl. slug redirects), and the view counter.
 */

type TopicRow = {
  id: string
  forum_id: string
  author_id: string
  title: string
  slug: string
  is_pinned: boolean
  is_locked: boolean
  post_count: number
  view_count?: number | null
  created_at: string
  last_post_at: string | null
  last_post_id?: string | null
  last_post_author_id: string | null
}

function topicRowToDomain(r: TopicRow, profiles: Map<string, ProfileRow>): ForoTopic {
  return {
    id: r.id,
    forumId: r.forum_id,
    title: r.title,
    slug: r.slug,
    isPinned: r.is_pinned,
    isLocked: r.is_locked,
    postCount: r.post_count,
    viewCount: r.view_count ?? 0,
    createdAt: r.created_at,
    lastPostAt: r.last_post_at,
    lastPostId: r.last_post_id ?? null,
    author: toAuthor(profiles.get(r.author_id)),
    lastPostAuthor: r.last_post_author_id ? toAuthor(profiles.get(r.last_post_author_id)) : null,
  }
}

// Using '*' so the query is schema-resilient until the view_count/last_post_id
// migration lands. Missing columns fall back to defaults in topicRowToDomain.
const TOPIC_COLUMNS = '*'

export async function listTopics(
  forumId: string,
  { limit = 30, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<ForoTopic[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('forum_topics')
    .select(TOPIC_COLUMNS)
    .eq('forum_id', forumId)
    .order('is_pinned', { ascending: false })
    .order('last_post_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const rows = (data ?? []) as TopicRow[]
  if (rows.length === 0) return []
  const ids = rows.flatMap(
    (r) => [r.author_id, r.last_post_author_id].filter(Boolean) as string[],
  )
  const profiles = await loadProfiles(ids)
  return rows.map((r) => topicRowToDomain(r, profiles))
}

export interface TopicListPage {
  stickies: ForoTopic[]
  regular: ForoTopic[]
  total: number
  page: number
  pageSize: number
}

export async function listTopicsPage(
  forumId: string,
  { page = 1, pageSize = 25 }: { page?: number; pageSize?: number } = {},
): Promise<TopicListPage> {
  const client = await getServerClient()
  const safePage = Math.max(1, Math.floor(page))
  const offset = (safePage - 1) * pageSize

  const { count } = await client
    .from('forum_topics')
    .select('id', { count: 'exact', head: true })
    .eq('forum_id', forumId)
    .eq('is_pinned', false)

  const [pinnedRes, regularRes] = await Promise.all([
    client
      .from('forum_topics')
      .select(TOPIC_COLUMNS)
      .eq('forum_id', forumId)
      .eq('is_pinned', true)
      .order('last_post_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    client
      .from('forum_topics')
      .select(TOPIC_COLUMNS)
      .eq('forum_id', forumId)
      .eq('is_pinned', false)
      .order('last_post_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1),
  ])

  const pinnedRows = (pinnedRes.data ?? []) as TopicRow[]
  const regularRows = (regularRes.data ?? []) as TopicRow[]
  const ids = [...pinnedRows, ...regularRows].flatMap(
    (r) => [r.author_id, r.last_post_author_id].filter(Boolean) as string[],
  )
  const profiles = await loadProfiles(ids)

  return {
    stickies: pinnedRows.map((r) => topicRowToDomain(r, profiles)),
    regular: regularRows.map((r) => topicRowToDomain(r, profiles)),
    total: count ?? 0,
    page: safePage,
    pageSize,
  }
}

export async function getTopicBySlug(
  spaceSlug: string,
  forumSlug: string,
  topicSlug: string,
): Promise<{ topic: ForoTopic; forum: ForoForum; space: ForoSpace } | null> {
  const space = await getSpaceBySlug(spaceSlug)
  if (!space) return null
  const forum = await getForumByslugInSpace(space.id, forumSlug)
  if (!forum) return null
  const client = await getServerClient()
  const { data } = await client
    .from('forum_topics')
    .select(TOPIC_COLUMNS)
    .eq('forum_id', forum.id)
    .eq('slug', topicSlug)
    .maybeSingle()
  if (!data) {
    const { data: redirect } = await client
      .from('forum_topic_redirects')
      .select('topic_id')
      .eq('old_forum_id', forum.id)
      .eq('old_slug', topicSlug)
      .maybeSingle()
    if (redirect) {
      const { data: redirected } = await client
        .from('forum_topics')
        .select(TOPIC_COLUMNS)
        .eq('id', (redirect as { topic_id: string }).topic_id)
        .maybeSingle()
      if (redirected) {
        const row = redirected as TopicRow
        const profiles = await loadProfiles(
          [row.author_id, row.last_post_author_id].filter(Boolean) as string[],
        )
        return { space, forum, topic: topicRowToDomain(row, profiles) }
      }
    }
    return null
  }
  const row = data as TopicRow
  const profiles = await loadProfiles(
    [row.author_id, row.last_post_author_id].filter(Boolean) as string[],
  )
  return { space, forum, topic: topicRowToDomain(row, profiles) }
}

export async function incrementTopicView(topicId: string): Promise<void> {
  const client = await getServerClient()
  try {
    await client.rpc('foro_increment_view', { p_topic_id: topicId })
  } catch {
    // RPC not yet deployed — silently skip; view_count stays at 0 until migration lands.
  }
}
