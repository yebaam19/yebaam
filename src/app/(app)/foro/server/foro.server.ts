import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import type {
  ForoAuthor,
  ForoCategory,
  ForoForum,
  ForoPost,
  ForoSpace,
  ForoTopic,
  OwnerType,
  SpaceVisibility,
} from '@/features/foro/types'

type CategoryRow = {
  id: string
  name: string
  slug: string
  position: number
  space_id: string
}
type ForumRow = {
  id: string
  category_id: string
  parent_forum_id: string | null
  name: string
  description: string | null
  slug: string
  position: number
}
type TopicRow = {
  id: string
  forum_id: string
  author_id: string
  title: string
  slug: string
  is_pinned: boolean
  is_locked: boolean
  post_count: number
  created_at: string
  last_post_at: string | null
  last_post_author_id: string | null
}
type PostRow = {
  id: string
  topic_id: string
  author_id: string
  content: string
  created_at: string
  edited_at: string | null
}
type ProfileRow = {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
}
type SpaceRow = {
  id: string
  owner_type: OwnerType
  owner_id: string
  slug: string
  name: string
  description: string | null
  visibility: SpaceVisibility
  enabled: boolean
  enabled_at: string
  created_at: string
}

function toAuthor(p: ProfileRow | undefined | null): ForoAuthor {
  if (!p) return { id: '', username: 'usuario', displayName: 'Usuario', avatarUrl: null }
  const displayName =
    p.display_name ||
    [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
    p.username ||
    'Usuario'
  return {
    id: p.id,
    username: p.username ?? 'usuario',
    displayName,
    avatarUrl: p.avatar_url,
  }
}

function toSpace(row: SpaceRow): ForoSpace {
  return {
    id: row.id,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    enabled: row.enabled,
    enabledAt: row.enabled_at,
    createdAt: row.created_at,
  }
}

async function loadProfiles(ids: string[]): Promise<Map<string, ProfileRow>> {
  const map = new Map<string, ProfileRow>()
  const unique = Array.from(new Set(ids.filter(Boolean)))
  if (unique.length === 0) return map
  const client = await getServerClient()
  const { data } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, display_name, avatar_url')
    .in('id', unique)
  for (const row of (data ?? []) as ProfileRow[]) map.set(row.id, row)
  return map
}

export async function listPublicSpaces(): Promise<ForoSpace[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('forum_spaces')
    .select('*')
    .eq('enabled', true)
    .order('created_at', { ascending: false })
  return ((data ?? []) as SpaceRow[]).map(toSpace)
}

export async function getSpaceBySlug(slug: string): Promise<ForoSpace | null> {
  const client = await getServerClient()
  const { data } = await client
    .from('forum_spaces')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return null
  return toSpace(data as SpaceRow)
}

export async function getSpaceBoard(spaceSlug: string): Promise<{
  space: ForoSpace
  categories: ForoCategory[]
} | null> {
  const space = await getSpaceBySlug(spaceSlug)
  if (!space) return null
  const client = await getServerClient()

  const { data: categories } = await client
    .from('forum_categories')
    .select('id, name, slug, position, space_id')
    .eq('space_id', space.id)
    .order('position', { ascending: true })

  const cats = (categories ?? []) as CategoryRow[]
  if (cats.length === 0) {
    return { space, categories: [] }
  }

  const { data: forums } = await client
    .from('forums')
    .select('id, category_id, parent_forum_id, name, description, slug, position')
    .in(
      'category_id',
      cats.map((c) => c.id),
    )
    .order('position', { ascending: true })

  const forumRows = (forums ?? []) as ForumRow[]
  const forumIds = forumRows.map((f) => f.id)

  // Aggregate topic/post counts + newest topic per forum
  let topicCountByForum = new Map<string, number>()
  let postSumByForum = new Map<string, number>()
  const newestByForum = new Map<
    string,
    { title: string; slug: string; lastPostAt: string | null; lastPostAuthorId: string | null }
  >()

  if (forumIds.length > 0) {
    const { data: topics } = await client
      .from('forum_topics')
      .select('forum_id, title, slug, post_count, last_post_at, last_post_author_id')
      .in('forum_id', forumIds)
      .order('last_post_at', { ascending: false, nullsFirst: false })

    for (const t of (topics ?? []) as Array<{
      forum_id: string
      title: string
      slug: string
      post_count: number
      last_post_at: string | null
      last_post_author_id: string | null
    }>) {
      topicCountByForum.set(t.forum_id, (topicCountByForum.get(t.forum_id) ?? 0) + 1)
      postSumByForum.set(t.forum_id, (postSumByForum.get(t.forum_id) ?? 0) + (t.post_count ?? 0))
      if (!newestByForum.has(t.forum_id)) {
        newestByForum.set(t.forum_id, {
          title: t.title,
          slug: t.slug,
          lastPostAt: t.last_post_at,
          lastPostAuthorId: t.last_post_author_id,
        })
      }
    }
  }

  const lastAuthorIds = Array.from(newestByForum.values())
    .map((v) => v.lastPostAuthorId)
    .filter((id): id is string => !!id)
  const profiles = await loadProfiles(lastAuthorIds)

  const forumById = new Map<string, ForoForum>()
  for (const f of forumRows) {
    const newest = newestByForum.get(f.id)
    forumById.set(f.id, {
      id: f.id,
      categoryId: f.category_id,
      spaceId: space.id,
      parentForumId: f.parent_forum_id,
      name: f.name,
      description: f.description,
      slug: f.slug,
      position: f.position,
      topicCount: topicCountByForum.get(f.id) ?? 0,
      postCount: postSumByForum.get(f.id) ?? 0,
      lastPostAt: newest?.lastPostAt ?? null,
      lastPostAuthor: newest?.lastPostAuthorId
        ? toAuthor(profiles.get(newest.lastPostAuthorId))
        : null,
      lastTopicTitle: newest?.title ?? null,
      lastTopicSlug: newest?.slug ?? null,
      subforums: [],
    })
  }

  // Build subforum tree: attach children to parents
  const topLevelByCategory = new Map<string, ForoForum[]>()
  for (const f of forumRows) {
    const node = forumById.get(f.id)!
    if (f.parent_forum_id && forumById.has(f.parent_forum_id)) {
      forumById.get(f.parent_forum_id)!.subforums.push(node)
    } else {
      const list = topLevelByCategory.get(f.category_id) ?? []
      list.push(node)
      topLevelByCategory.set(f.category_id, list)
    }
  }

  const categoriesOut: ForoCategory[] = cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    position: c.position,
    spaceId: c.space_id,
    forums: (topLevelByCategory.get(c.id) ?? []).sort((a, b) => a.position - b.position),
  }))

  return { space, categories: categoriesOut }
}

export async function getForumByslugInSpace(
  spaceId: string,
  forumSlug: string,
): Promise<ForoForum | null> {
  const client = await getServerClient()
  // Forums don't have space_id directly — we join through forum_categories.
  const { data: cats } = await client
    .from('forum_categories')
    .select('id')
    .eq('space_id', spaceId)
  const catIds = ((cats ?? []) as { id: string }[]).map((c) => c.id)
  if (catIds.length === 0) return null
  const { data } = await client
    .from('forums')
    .select('id, category_id, parent_forum_id, name, description, slug, position')
    .in('category_id', catIds)
    .eq('slug', forumSlug)
    .maybeSingle()
  if (!data) return null
  const row = data as ForumRow
  return {
    id: row.id,
    categoryId: row.category_id,
    spaceId,
    parentForumId: row.parent_forum_id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    position: row.position,
    topicCount: 0,
    postCount: 0,
    lastPostAt: null,
    lastPostAuthor: null,
    lastTopicTitle: null,
    lastTopicSlug: null,
    subforums: [],
  }
}

export async function listTopics(
  forumId: string,
  { limit = 30, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<ForoTopic[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('forum_topics')
    .select(
      'id, forum_id, author_id, title, slug, is_pinned, is_locked, post_count, created_at, last_post_at, last_post_author_id',
    )
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

  return rows.map((r) => ({
    id: r.id,
    forumId: r.forum_id,
    title: r.title,
    slug: r.slug,
    isPinned: r.is_pinned,
    isLocked: r.is_locked,
    postCount: r.post_count,
    createdAt: r.created_at,
    lastPostAt: r.last_post_at,
    author: toAuthor(profiles.get(r.author_id)),
    lastPostAuthor: r.last_post_author_id ? toAuthor(profiles.get(r.last_post_author_id)) : null,
  }))
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
    .select(
      'id, forum_id, author_id, title, slug, is_pinned, is_locked, post_count, created_at, last_post_at, last_post_author_id',
    )
    .eq('forum_id', forum.id)
    .eq('slug', topicSlug)
    .maybeSingle()
  if (!data) {
    // redirect lookup
    const { data: redirect } = await client
      .from('forum_topic_redirects')
      .select('topic_id')
      .eq('old_forum_id', forum.id)
      .eq('old_slug', topicSlug)
      .maybeSingle()
    if (redirect) {
      const { data: redirected } = await client
        .from('forum_topics')
        .select(
          'id, forum_id, author_id, title, slug, is_pinned, is_locked, post_count, created_at, last_post_at, last_post_author_id',
        )
        .eq('id', (redirect as { topic_id: string }).topic_id)
        .maybeSingle()
      if (redirected) {
        const row = redirected as TopicRow
        const profiles = await loadProfiles(
          [row.author_id, row.last_post_author_id].filter(Boolean) as string[],
        )
        return {
          space,
          forum,
          topic: {
            id: row.id,
            forumId: row.forum_id,
            title: row.title,
            slug: row.slug,
            isPinned: row.is_pinned,
            isLocked: row.is_locked,
            postCount: row.post_count,
            createdAt: row.created_at,
            lastPostAt: row.last_post_at,
            author: toAuthor(profiles.get(row.author_id)),
            lastPostAuthor: row.last_post_author_id
              ? toAuthor(profiles.get(row.last_post_author_id))
              : null,
          },
        }
      }
    }
    return null
  }
  const row = data as TopicRow
  const profiles = await loadProfiles(
    [row.author_id, row.last_post_author_id].filter(Boolean) as string[],
  )
  return {
    space,
    forum,
    topic: {
      id: row.id,
      forumId: row.forum_id,
      title: row.title,
      slug: row.slug,
      isPinned: row.is_pinned,
      isLocked: row.is_locked,
      postCount: row.post_count,
      createdAt: row.created_at,
      lastPostAt: row.last_post_at,
      author: toAuthor(profiles.get(row.author_id)),
      lastPostAuthor: row.last_post_author_id
        ? toAuthor(profiles.get(row.last_post_author_id))
        : null,
    },
  }
}

export async function listPosts(
  topicId: string,
  { limit = 100, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<ForoPost[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('forum_posts')
    .select('id, topic_id, author_id, content, created_at, edited_at')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  const rows = (data ?? []) as PostRow[]
  if (rows.length === 0) return []
  const profiles = await loadProfiles(rows.map((r) => r.author_id))
  return rows.map((r) => ({
    id: r.id,
    topicId: r.topic_id,
    content: r.content,
    createdAt: r.created_at,
    editedAt: r.edited_at,
    author: toAuthor(profiles.get(r.author_id)),
  }))
}

export async function isSpaceAdmin(spaceId: string): Promise<boolean> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return false
  const { data } = await client
    .from('forum_roles')
    .select('role')
    .eq('space_id', spaceId)
    .eq('user_id', auth.user.id)
    .eq('role', 'admin')
    .limit(1)
  if ((data?.length ?? 0) > 0) return true
  return isPlatformAdmin()
}

export async function isSpaceModerator(spaceId: string): Promise<boolean> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return false
  const { data } = await client
    .from('forum_roles')
    .select('role')
    .eq('space_id', spaceId)
    .eq('user_id', auth.user.id)
    .limit(1)
  if ((data?.length ?? 0) > 0) return true
  return isPlatformAdmin()
}

export async function isPlatformAdmin(): Promise<boolean> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return false
  const { data } = await client
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', auth.user.id)
    .maybeSingle()
  return !!data
}
