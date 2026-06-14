import 'server-only'
import { getServerClient } from '@/utils/supabase/server'

/**
 * Aggregate active grant counts + pending request counts per badge for the
 * `/admin/badges/**` list + detail reads. Extracted from `badges.server.ts`
 * for file size only — intentionally NOT `cache()`-wrapped (the badgeIds array
 * is an unstable cache key), matching the original behavior.
 */

export async function aggregateBadgeCounts(
  badgeIds: string[],
): Promise<Record<string, { grants: number; requests: number }>> {
  const out: Record<string, { grants: number; requests: number }> = {}
  if (badgeIds.length === 0) return out
  for (const id of badgeIds) out[id] = { grants: 0, requests: 0 }

  const client = await getServerClient()
  const [grants, requests] = await Promise.all([
    client.from('user_badges').select('badge_id').in('badge_id', badgeIds).is('revoked_at', null),
    client.from('badge_requests').select('badge_id').in('badge_id', badgeIds).eq('status', 'pending'),
  ])
  for (const row of (grants.data ?? []) as Array<{ badge_id: string }>) {
    if (out[row.badge_id]) out[row.badge_id].grants += 1
  }
  for (const row of (requests.data ?? []) as Array<{ badge_id: string }>) {
    if (out[row.badge_id]) out[row.badge_id].requests += 1
  }
  return out
}
