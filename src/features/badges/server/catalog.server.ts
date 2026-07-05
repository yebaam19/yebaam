import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/features/badges/server/cf'
import type { CatalogBadge } from '@/features/badges/types/badges.types'

/**
 * Public reads for the `/insignias` catalog. Wrapped in `react.cache()` so the
 * list query is deduped within a single request. We can't use `unstable_cache`
 * because the supabase server client calls `cookies()` for session cookies,
 * which is incompatible with `unstable_cache` per Next.js.
 *
 * RLS on `public.badges` filters out deleted/private rows for all callers.
 */

type Row = {
  id: string
  slug: string
  name: string
  description: string
  icon_cf_image_id: string | null
  category: string
  slot: 'insignia' | 'badge'
  tier: string | null
  requestable: boolean
  evidence_required: boolean
  requirements_md: string
  is_system: boolean
}

async function fetchCatalog(filter: { slot?: string; category?: string }): Promise<CatalogBadge[]> {
  const client = await getServerClient()
  let q = client
    .from('badges')
    .select(
      'id, slug, name, description, icon_cf_image_id, category, slot, tier, requestable, evidence_required, requirements_md, is_system',
    )
    .is('deleted_at', null)
    .eq('visibility', 'public')
    .order('is_system', { ascending: false })
    .order('name', { ascending: true })
  if (filter.slot === 'insignia' || filter.slot === 'badge') q = q.eq('slot', filter.slot)
  if (filter.category) q = q.eq('category', filter.category)
  const { data, error } = await q
  if (error) {
    console.error('[catalog.fetchCatalog]', error)
    return []
  }
  const rows = (data ?? []) as Row[]
  const counts = await fetchGrantCounts(rows.map((r) => r.id))
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    iconUrl: cfImageUrl(r.icon_cf_image_id),
    category: r.category,
    slot: r.slot,
    tier: r.tier,
    requestable: Boolean(r.requestable),
    evidenceRequired: Boolean(r.evidence_required),
    requirementsMd: r.requirements_md,
    isSystem: Boolean(r.is_system),
    grantCount: counts[r.id] ?? 0,
  }))
}

async function fetchGrantCounts(badgeIds: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  if (badgeIds.length === 0) return out
  for (const id of badgeIds) out[id] = 0
  const client = await getServerClient()
  const { data, error } = await client
    .from('user_badges')
    .select('badge_id')
    .in('badge_id', badgeIds)
    .is('revoked_at', null)
    .eq('acceptance_status', 'accepted')
    .eq('is_hidden', false)
  if (error) {
    console.error('[catalog.fetchGrantCounts]', error)
    return out
  }
  for (const row of (data ?? []) as Array<{ badge_id: string }>) {
    if (badgeIds.includes(row.badge_id)) out[row.badge_id] += 1
  }
  return out
}

export const listPublicBadgeCatalog = cache(
  async (filter: { slot?: string; category?: string } = {}) => fetchCatalog(filter),
)

export async function getPublicBadgeBySlug(slug: string): Promise<CatalogBadge | null> {
  const list = await listPublicBadgeCatalog({})
  return list.find((b) => b.slug === slug) ?? null
}

/** Returns the viewer's relationship to a badge:
 *  - `holds`: an active accepted grant exists
 *  - `pendingGrant`: an active grant exists but is not yet accepted
 *  - `pendingRequest`: the viewer submitted a request that is still open
 *  - `none`: no relationship
 *  Used by `/insignias/[slug]` to decide whether to render the request button.
 */
export async function getViewerBadgeStatus(badgeId: string): Promise<
  'holds' | 'pendingGrant' | 'pendingRequest' | 'none'
> {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  if (!auth?.user) return 'none'
  const userId = auth.user.id

  const [grant, request] = await Promise.all([
    client
      .from('user_badges')
      .select('id, acceptance_status, revoked_at')
      .eq('badge_id', badgeId)
      .eq('user_id', userId)
      .is('revoked_at', null)
      .maybeSingle(),
    client
      .from('badge_requests')
      .select('id')
      .eq('badge_id', badgeId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle(),
  ])
  if (grant.data) {
    return grant.data.acceptance_status === 'accepted' ? 'holds' : 'pendingGrant'
  }
  if (request.data) return 'pendingRequest'
  return 'none'
}
