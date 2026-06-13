import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import { loadProfiles, toAuthor } from './_profile-row'
import type { ForoPost } from '@/features/foro/types'

/**
 * Forum posts within a topic, plus the per-author meta (post count, joined-at,
 * location, signature) rendered alongside each post.
 */

type PostRow = {
  id: string
  topic_id: string
  author_id: string
  content: string
  created_at: string
  edited_at: string | null
  post_number?: number | null
}

export async function listPosts(
  topicId: string,
  { limit = 100, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<ForoPost[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('forum_posts')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  const rows = (data ?? []) as PostRow[]
  if (rows.length === 0) return []
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)))
  const [profiles, metas] = await Promise.all([
    loadProfiles(authorIds),
    loadAuthorMeta(authorIds),
  ])
  return rows.map((r, idx) => ({
    id: r.id,
    topicId: r.topic_id,
    content: r.content,
    createdAt: r.created_at,
    editedAt: r.edited_at,
    postNumber: r.post_number ?? offset + idx + 1,
    author: toAuthor(profiles.get(r.author_id)),
    authorMeta: metas.get(r.author_id),
  }))
}

export interface TopicPostPage {
  posts: ForoPost[]
  total: number
  page: number
  pageSize: number
}

export async function listTopicPostsPage(
  topicId: string,
  { page = 1, pageSize = 15 }: { page?: number; pageSize?: number } = {},
): Promise<TopicPostPage> {
  const client = await getServerClient()
  const safePage = Math.max(1, Math.floor(page))
  const offset = (safePage - 1) * pageSize

  const { count } = await client
    .from('forum_posts')
    .select('id', { count: 'exact', head: true })
    .eq('topic_id', topicId)

  const posts = await listPosts(topicId, { limit: pageSize, offset })
  return { posts, total: count ?? 0, page: safePage, pageSize }
}

async function loadAuthorMeta(ids: string[]): Promise<Map<string, {
  postCount: number
  joinedAt: string | null
  location: string | null
  signature: string | null
}>> {
  const map = new Map<string, {
    postCount: number
    joinedAt: string | null
    location: string | null
    signature: string | null
  }>()
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return map
  const client = await getServerClient()
  const [profilesRes, countsRes] = await Promise.all([
    client.from('profiles').select('*').in('id', unique),
    client.from('forum_posts').select('author_id').in('author_id', unique),
  ])
  const counts = new Map<string, number>()
  for (const row of (countsRes.data ?? []) as { author_id: string }[]) {
    counts.set(row.author_id, (counts.get(row.author_id) ?? 0) + 1)
  }
  for (const p of (profilesRes.data ?? []) as Record<string, unknown>[]) {
    const id = p.id as string
    map.set(id, {
      postCount: counts.get(id) ?? 0,
      joinedAt: (p.created_at as string | null) ?? null,
      location: (p.location as string | null) ?? null,
      signature: (p.foro_signature as string | null) ?? (p.signature as string | null) ?? null,
    })
  }
  return map
}
