import 'server-only'
import { getServiceClient } from '@/utils/supabase/server'
import { sanitizePostgrestFilterTerm } from '@/lib/supabase-filter'

export interface AdminPageRow {
  id: string
  name: string
  slug: string
  category: string | null
  privacy: string
  isVerified: boolean
  followerCount: number
  postCount: number
  ownerUsername: string | null
  createdAt: string
}

export interface AdminPagesResult {
  /** Newest 100 matching pages (the list itself stays capped at 100 rows). */
  pages: AdminPageRow[]
  /** Total matching rows in the DB, independent of the 100-row cap. */
  total: number
}

export async function listAdminPages(search = ''): Promise<AdminPagesResult> {
  const client = getServiceClient()
  // PostgREST's .or() grammar treats , ( ) as separators — strip them and
  // escape the ilike wildcards so a search like "a,b" or "(x)" can't crash
  // the page or inject conditions.
  const term = sanitizePostgrestFilterTerm(search)

  let query = client
    .from('pages')
    .select('id,name,slug,category,privacy,is_verified,follower_count,post_count,owner_id,created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .limit(100)

  if (term) {
    query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
  }

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<Record<string, unknown>>
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id as string)))
  const { data: profiles } = ownerIds.length
    ? await client.from('profiles').select('id,username').in('id', ownerIds)
    : { data: [] as Array<{ id: string; username: string | null }> }

  const profileMap = new Map(
    ((profiles ?? []) as Array<{ id: string; username: string | null }>).map((p) => [
      p.id,
      p.username,
    ])
  )

  const pages = rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    category: (r.category as string | null) ?? null,
    privacy: r.privacy as string,
    isVerified: Boolean(r.is_verified),
    followerCount: (r.follower_count as number) ?? 0,
    postCount: (r.post_count as number) ?? 0,
    ownerUsername: profileMap.get(r.owner_id as string) ?? null,
    createdAt: r.created_at as string,
  }))

  return { pages, total: count ?? pages.length }
}
