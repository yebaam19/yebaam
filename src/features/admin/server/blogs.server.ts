import 'server-only'
import { getServiceClient } from '@/utils/supabase/server'

export interface AdminBlogBadge {
  slug: string
  name: string
}

export interface AdminBlogRow {
  id: string
  name: string
  slug: string
  ownerName: string
  ownerUsername: string
  isVerified: boolean
  distinction: string | null
  followersCount: number
  badges: AdminBlogBadge[]
}

export interface BadgeOption {
  id: string
  slug: string
  name: string
}

/** Admin listing of Blog del Músico profiles for verification/grants. Uses the
 *  service client because this is platform-admin-only tooling. */
export async function listAdminBlogs(search = ''): Promise<AdminBlogRow[]> {
  const svc = getServiceClient()
  let q = svc
    .from('blogs')
    .select('id, name, slug, owner_id, is_verified, distinction, followers_count')
    .order('created_at', { ascending: false })
    .limit(100)
  if (search) q = q.ilike('name', `%${search}%`)
  const { data } = await q
  const rows = (data ?? []) as Array<{
    id: string
    name: string
    slug: string
    owner_id: string
    is_verified: boolean | null
    distinction: string | null
    followers_count: number | null
  }>

  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id)))
  const { data: profiles } = ownerIds.length
    ? await svc.from('profiles').select('id, username, first_name, last_name').in('id', ownerIds)
    : { data: [] as Array<{ id: string; username: string | null; first_name: string | null; last_name: string | null }> }
  const pmap = new Map(
    ((profiles ?? []) as Array<{ id: string; username: string | null; first_name: string | null; last_name: string | null }>).map(
      (p) => [p.id, p] as const
    )
  )

  const blogIds = rows.map((r) => r.id)
  const { data: bb } = blogIds.length
    ? await svc.from('blog_badges').select('blog_id, badges(slug, name)').in('blog_id', blogIds)
    : { data: [] as unknown[] }
  const badgesByBlog = new Map<string, AdminBlogBadge[]>()
  for (const r of (bb ?? []) as Array<{ blog_id: string; badges: { slug: string; name: string } | null }>) {
    if (!r.badges) continue
    const list = badgesByBlog.get(r.blog_id) ?? []
    list.push({ slug: r.badges.slug, name: r.badges.name })
    badgesByBlog.set(r.blog_id, list)
  }

  return rows.map((r) => {
    const p = pmap.get(r.owner_id)
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      ownerName: [p?.first_name, p?.last_name].filter(Boolean).join(' ') || (p?.username ?? '—'),
      ownerUsername: p?.username ?? '',
      isVerified: Boolean(r.is_verified),
      distinction: r.distinction,
      followersCount: r.followers_count ?? 0,
      badges: badgesByBlog.get(r.id) ?? [],
    }
  })
}

/** Active badge catalog for the "grant to blog" dropdown. */
export async function listBadgeOptions(): Promise<BadgeOption[]> {
  const svc = getServiceClient()
  const { data } = await svc
    .from('badges')
    .select('id, slug, name')
    .is('deleted_at', null)
    .order('name', { ascending: true })
  return (data ?? []) as BadgeOption[]
}
