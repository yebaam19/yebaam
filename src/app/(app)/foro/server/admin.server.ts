import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import type {
  ForoAuthor,
  ForoRoleMember,
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

  const [clubsRes, groupsRes, pagesRes, blogsRes, spacesRes] = await Promise.all([
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
