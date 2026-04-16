import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import type {
  ForoAuthor,
  ForoGlobalStaff,
  ForoRoleMember,
  ForoRoleType,
  ForoTopic,
  OwnerCandidate,
  OwnerType,
  SpaceVisibility,
} from '@/features/foro/types'

type ProfileRow = {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
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

function normalizeVisibility(raw: string | null | undefined): SpaceVisibility {
  const v = (raw ?? 'public').toLowerCase()
  if (v === 'private') return 'private'
  if (v === 'secret') return 'secret'
  return 'public'
}

/**
 * List potential forum-space owners (clubs, groups, pages, blogs) alongside whether
 * a forum_spaces row already exists for each.
 */
export async function listForumOwnerCandidates(query?: string): Promise<OwnerCandidate[]> {
  const client = await getServerClient()

  const PORTAL_OWNER_ID = '00000000-0000-0000-0000-000000000000'
  const { data: authData } = await client.auth.getUser()
  const currentUserId = authData?.user?.id ?? null

  const [clubsRes, groupsRes, pagesRes, blogsRes, spacesRes, profilesRes] = await Promise.all([
    client
      .from('clubs')
      .select('id, name, slug, privacy')
      .order('created_at', { ascending: false })
      .limit(200),
    client
      .from('groups')
      .select('id, name, privacy')
      .order('created_at', { ascending: false })
      .limit(200),
    client
      .from('pages')
      .select('id, name, slug, privacy')
      .order('created_at', { ascending: false })
      .limit(200),
    client
      .from('blogs')
      .select('id, name, slug')
      .order('created_at', { ascending: false })
      .limit(200),
    client.from('forum_spaces').select('id, owner_type, owner_id, slug, enabled'),
    client
      .from('profiles')
      .select('id, username, display_name, first_name, last_name')
      .order('username', { ascending: true })
      .limit(50),
  ])

  const spaceByKey = new Map<
    string,
    { id: string; slug: string; enabled: boolean }
  >()
  for (const s of (spacesRes.data ?? []) as Array<{
    id: string
    owner_type: string
    owner_id: string
    slug: string
    enabled: boolean
  }>) {
    spaceByKey.set(`${s.owner_type}:${s.owner_id}`, {
      id: s.id,
      slug: s.slug,
      enabled: s.enabled,
    })
  }

  const candidates: OwnerCandidate[] = []

  const push = (
    ownerType: OwnerType,
    row: { id: string; name: string; slug?: string | null; privacy?: string | null },
  ) => {
    const existing = spaceByKey.get(`${ownerType}:${row.id}`)
    candidates.push({
      ownerType,
      ownerId: row.id,
      name: row.name,
      slug: row.slug ?? null,
      privacy: normalizeVisibility(row.privacy),
      hasSpace: !!existing,
      spaceSlug: existing?.slug ?? null,
      spaceEnabled: existing ? existing.enabled : null,
    })
  }

  for (const c of (clubsRes.data ?? []) as Array<{
    id: string
    name: string
    slug: string | null
    privacy: string | null
  }>) {
    push('club', c)
  }
  for (const g of (groupsRes.data ?? []) as Array<{
    id: string
    name: string
    privacy: string | null
  }>) {
    push('group', { id: g.id, name: g.name, slug: null, privacy: g.privacy })
  }
  for (const p of (pagesRes.data ?? []) as Array<{
    id: string
    name: string
    slug: string | null
    privacy: string | null
  }>) {
    push('page', p)
  }
  for (const b of (blogsRes.data ?? []) as Array<{
    id: string
    name: string
    slug: string | null
  }>) {
    push('blog', { ...b, privacy: 'public' })
  }

  for (const p of (profilesRes.data ?? []) as Array<{
    id: string
    username: string | null
    display_name: string | null
    first_name: string | null
    last_name: string | null
  }>) {
    const name =
      p.display_name ||
      [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
      p.username ||
      'Perfil'
    push('profile', { id: p.id, name, slug: p.username, privacy: 'public' })
  }

  // Always include the singleton Portal option (platform-wide forum)
  push('portal', { id: PORTAL_OWNER_ID, name: 'Portal', slug: 'portal', privacy: 'public' })

  void currentUserId

  const q = query?.trim().toLowerCase()
  const filtered = q
    ? candidates.filter(
        (c) => c.name.toLowerCase().includes(q) || (c.slug ?? '').toLowerCase().includes(q),
      )
    : candidates
  return filtered.sort((a, b) => a.name.localeCompare(b.name))
}

export async function listSpaceRoles(spaceId: string): Promise<ForoRoleMember[]> {
  const client = await getServerClient()
  const { data: rolesData } = await client
    .from('forum_roles')
    .select('space_id, user_id, role, granted_at')
    .eq('space_id', spaceId)
    .order('granted_at', { ascending: true })
  const rows = (rolesData ?? []) as Array<{
    space_id: string
    user_id: string
    role: 'admin' | 'moderator'
    granted_at: string
  }>
  if (rows.length === 0) return []
  const ids = Array.from(new Set(rows.map((r) => r.user_id)))
  const { data: profiles } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, display_name, avatar_url')
    .in('id', ids)
  const profileById = new Map<string, ProfileRow>()
  for (const p of (profiles ?? []) as ProfileRow[]) profileById.set(p.id, p)
  return rows.map((r) => ({
    spaceId: r.space_id,
    userId: r.user_id,
    role: r.role,
    grantedAt: r.granted_at,
    user: toAuthor(profileById.get(r.user_id)),
  }))
}

export async function listPlatformAdmins(): Promise<ForoAuthor[]> {
  const client = await getServerClient()
  const { data } = await client.from('platform_admins').select('user_id')
  const ids = ((data ?? []) as { user_id: string }[]).map((r) => r.user_id)
  if (ids.length === 0) return []
  const { data: profiles } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, display_name, avatar_url')
    .in('id', ids)
  return ((profiles ?? []) as ProfileRow[]).map(toAuthor)
}

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

  const profileIds = Array.from(
    new Set(
      rows.flatMap((r) => [r.author_id, r.last_post_author_id].filter(Boolean) as string[]),
    ),
  )
  const { data: profilesData } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, display_name, avatar_url')
    .in('id', profileIds)
  const profileById = new Map<string, ProfileRow>()
  for (const p of (profilesData ?? []) as ProfileRow[]) profileById.set(p.id, p)

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

export interface AdminFilterOption {
  id: string
  slug: string
  name: string
}

export interface AdminForumOption extends AdminFilterOption {
  spaceId: string
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

export async function listForumGlobalStaff(): Promise<ForoGlobalStaff[]> {
  const client = await getServerClient()
  const { data } = await client
    .from('forum_global_roles')
    .select('user_id, role, granted_at')
    .order('granted_at', { ascending: true })
  const rows = (data ?? []) as Array<{
    user_id: string
    role: ForoRoleType
    granted_at: string
  }>
  if (rows.length === 0) return []
  const ids = Array.from(new Set(rows.map((r) => r.user_id)))
  const { data: profiles } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, display_name, avatar_url')
    .in('id', ids)
  const byId = new Map<string, ProfileRow>()
  for (const p of (profiles ?? []) as ProfileRow[]) byId.set(p.id, p)
  return rows.map((r) => ({
    role: r.role,
    grantedAt: r.granted_at,
    user: toAuthor(byId.get(r.user_id)),
  }))
}

export interface AdminActiveUser {
  user: ForoAuthor
  createdAt: string
}

export interface ListActiveUsersResult {
  items: AdminActiveUser[]
  total: number
  page: number
  pageSize: number
  excludedAdmins: number
}

/**
 * Lists platform users excluding admins (platform_admins + forum_global_roles with role='admin').
 * Moderators are still included since they are not administrators.
 */
export async function listActiveUsers(params?: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<ListActiveUsersResult> {
  const client = await getServerClient()
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 25))

  const [platformAdminsRes, forumAdminsRes] = await Promise.all([
    client.from('platform_admins').select('user_id'),
    client.from('forum_global_roles').select('user_id').eq('role', 'admin'),
  ])
  const excluded = new Set<string>()
  for (const r of (platformAdminsRes.data ?? []) as Array<{ user_id: string }>) {
    excluded.add(r.user_id)
  }
  for (const r of (forumAdminsRes.data ?? []) as Array<{ user_id: string }>) {
    excluded.add(r.user_id)
  }

  const search = params?.search?.trim() ?? ''
  let query = client
    .from('profiles')
    .select('id, username, first_name, last_name, display_name, avatar_url, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })

  if (excluded.size > 0) {
    const list = Array.from(excluded)
      .map((id) => `"${id}"`)
      .join(',')
    query = query.not('id', 'in', `(${list})`)
  }
  if (search) {
    const escaped = search.replace(/[%,]/g, ' ')
    const like = `%${escaped}%`
    query = query.or(
      `username.ilike.${like},display_name.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`,
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count } = await query.range(from, to)

  const rows = (data ?? []) as Array<ProfileRow & { created_at: string }>
  return {
    items: rows.map((r) => ({ user: toAuthor(r), createdAt: r.created_at })),
    total: count ?? 0,
    page,
    pageSize,
    excludedAdmins: excluded.size,
  }
}
