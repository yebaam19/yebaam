import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import type { ForoTopic } from '@/features/foro/types'
import { loadProfiles, toAuthor } from './_profile-row'

export interface ForoTopicAdminRow extends ForoTopic {
  spaceId: string
  spaceSlug: string
  spaceName: string
  forumSlug: string
  forumName: string
}

export interface AdminTopicListPage {
  topics: ForoTopicAdminRow[]
  total: number
  page: number
  pageSize: number
}

export interface AdminTopicListFilters {
  search?: string
  spaceId?: string
  forumId?: string
  authorUsername?: string
  isPinned?: boolean
  isLocked?: boolean
  page?: number
  pageSize?: number
}

export interface AdminFilterOption {
  id: string
  slug: string
  name: string
}

export interface AdminForumOption extends AdminFilterOption {
  spaceId: string
}

// Cross-space topic moderation feed for the admin panel. Filters compose; an
// admin can search for "ayuda", restrict to one space + forum, and filter to
// pinned-only without leaving the page. Caller must already be authorized via
// the (protected) admin layout's `canAccessForumAdmin()` guard.
export async function listAllTopicsAdmin(
  filters: AdminTopicListFilters = {},
): Promise<AdminTopicListPage> {
  const { search, spaceId, forumId, authorUsername, isPinned, isLocked } = filters
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 25))
  const page = Math.max(1, Math.floor(filters.page ?? 1))
  const offset = (page - 1) * pageSize

  const client = await getServerClient()

  // Map space → category → forum so we can both display ownership AND restrict
  // by spaceId (the topic table only carries forum_id).
  const [spacesRes, categoriesRes, forumsRes] = await Promise.all([
    client.from('forum_spaces').select('id, slug, name'),
    client.from('forum_categories').select('id, space_id'),
    client.from('forums').select('id, category_id, slug, name'),
  ])
  type SpaceRow = { id: string; slug: string; name: string }
  type CatRow = { id: string; space_id: string }
  type ForumRow = { id: string; category_id: string; slug: string; name: string }
  const spaceById = new Map<string, SpaceRow>()
  for (const s of (spacesRes.data ?? []) as SpaceRow[]) spaceById.set(s.id, s)
  const spaceIdByCategoryId = new Map<string, string>()
  for (const c of (categoriesRes.data ?? []) as CatRow[]) spaceIdByCategoryId.set(c.id, c.space_id)
  const forumById = new Map<string, ForumRow & { space_id: string | null }>()
  for (const f of (forumsRes.data ?? []) as ForumRow[]) {
    forumById.set(f.id, { ...f, space_id: spaceIdByCategoryId.get(f.category_id) ?? null })
  }

  // If filtering by space, narrow the forum_id IN-list at query time so the
  // count is accurate (rather than slicing post-query).
  let restrictForumIds: string[] | null = null
  if (forumId) {
    restrictForumIds = [forumId]
  } else if (spaceId) {
    restrictForumIds = Array.from(forumById.values())
      .filter((f) => f.space_id === spaceId)
      .map((f) => f.id)
    if (restrictForumIds.length === 0) {
      return { topics: [], total: 0, page, pageSize }
    }
  }

  // If filtering by author username, resolve the user id first (one extra
  // round-trip but the admin will type a specific username so this is rare).
  let authorIdFilter: string | null = null
  if (authorUsername?.trim()) {
    const { data } = await client
      .from('profiles')
      .select('id')
      .eq('username', authorUsername.trim())
      .maybeSingle()
    if (!data) return { topics: [], total: 0, page, pageSize }
    authorIdFilter = (data as { id: string }).id
  }

  let countQuery = client
    .from('forum_topics')
    .select('id', { count: 'exact', head: true })
  let listQuery = client
    .from('forum_topics')
    .select('*')
    .order('last_post_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (restrictForumIds) {
    countQuery = countQuery.in('forum_id', restrictForumIds)
    listQuery = listQuery.in('forum_id', restrictForumIds)
  }
  if (authorIdFilter) {
    countQuery = countQuery.eq('author_id', authorIdFilter)
    listQuery = listQuery.eq('author_id', authorIdFilter)
  }
  if (typeof isPinned === 'boolean') {
    countQuery = countQuery.eq('is_pinned', isPinned)
    listQuery = listQuery.eq('is_pinned', isPinned)
  }
  if (typeof isLocked === 'boolean') {
    countQuery = countQuery.eq('is_locked', isLocked)
    listQuery = listQuery.eq('is_locked', isLocked)
  }
  if (search?.trim()) {
    const pattern = `%${search.trim().replace(/[%_]/g, '\\$&')}%`
    countQuery = countQuery.ilike('title', pattern)
    listQuery = listQuery.ilike('title', pattern)
  }

  const [countRes, listRes] = await Promise.all([countQuery, listQuery])
  const rows = (listRes.data ?? []) as Array<{
    id: string
    forum_id: string
    author_id: string
    title: string
    slug: string
    is_pinned: boolean
    is_locked: boolean
    post_count: number
    view_count: number | null
    created_at: string
    last_post_at: string | null
    last_post_id: string | null
    last_post_author_id: string | null
  }>

  if (rows.length === 0) {
    return { topics: [], total: countRes.count ?? 0, page, pageSize }
  }

  const profileById = await loadProfiles(
    rows.flatMap((r) => [r.author_id, r.last_post_author_id].filter(Boolean) as string[]),
  )

  const topics: ForoTopicAdminRow[] = rows.map((r) => {
    const forum = forumById.get(r.forum_id)
    const space = forum?.space_id ? spaceById.get(forum.space_id) : undefined
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
      lastPostId: r.last_post_id,
      author: toAuthor(profileById.get(r.author_id)),
      lastPostAuthor: r.last_post_author_id
        ? toAuthor(profileById.get(r.last_post_author_id))
        : null,
      spaceId: space?.id ?? '',
      spaceSlug: space?.slug ?? '',
      spaceName: space?.name ?? '—',
      forumSlug: forum?.slug ?? '',
      forumName: forum?.name ?? '—',
    }
  })

  return { topics, total: countRes.count ?? 0, page, pageSize }
}

export async function listAdminFilterOptions(): Promise<{
  spaces: AdminFilterOption[]
  forums: AdminForumOption[]
}> {
  const client = await getServerClient()
  const [spacesRes, categoriesRes, forumsRes] = await Promise.all([
    client.from('forum_spaces').select('id, slug, name').order('name', { ascending: true }),
    client.from('forum_categories').select('id, space_id'),
    client
      .from('forums')
      .select('id, category_id, slug, name')
      .order('name', { ascending: true }),
  ])

  type CatRow = { id: string; space_id: string }
  const spaceIdByCategory = new Map<string, string>()
  for (const c of (categoriesRes.data ?? []) as CatRow[]) spaceIdByCategory.set(c.id, c.space_id)
  const forums: AdminForumOption[] = ((forumsRes.data ?? []) as Array<{
    id: string
    category_id: string
    slug: string
    name: string
  }>).map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    spaceId: spaceIdByCategory.get(f.category_id) ?? '',
  }))
  return {
    spaces: ((spacesRes.data ?? []) as AdminFilterOption[]).map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
    })),
    forums,
  }
}
