import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/features/cities/server/cf'
import { withImageVariant } from '@/lib/media/urls'

/**
 * Shared infrastructure for the admin city reads: the pagination envelope and
 * the profile lookup + display-name/avatar helpers used by the city-admins,
 * moderation, contact-inbox, and complaints modules.
 */

export type PaginatedList<T> = { items: T[]; total: number; page: number; pageSize: number }

export type ProfileLite = {
  id: string
  username: string | null
  display_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  avatar_cloudflare_id: string | null
}

export async function fetchProfilesByIds(
  ids: ReadonlyArray<string | null>,
): Promise<Map<string, ProfileLite>> {
  const clean = Array.from(new Set(ids.filter((id): id is string => Boolean(id))))
  const out = new Map<string, ProfileLite>()
  if (clean.length === 0) return out
  const client = await getServerClient()
  const { data, error } = await client
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, avatar_url, avatar_cloudflare_id')
    .in('id', clean)
  if (error) {
    console.error('[fetchProfilesByIds]', error)
    return out
  }
  for (const row of (data ?? []) as ProfileLite[]) out.set(row.id, row)
  return out
}

export function profileToDisplay(p: ProfileLite | undefined | null): string | null {
  if (!p) return null
  if (p.display_name) return p.display_name
  const composed = [p.first_name, p.last_name].filter(Boolean).join(' ')
  if (composed) return composed
  return p.username
}

// Admin tables render this in ~32 px cells, so retarget the 128x128 `avatar`
// variant instead of the full-size `/public` original (~60-115 KB per row).
export function profileToAvatar(p: ProfileLite | undefined | null): string | null {
  if (!p) return null
  const raw = (p.avatar_cloudflare_id ? cfImageUrl(p.avatar_cloudflare_id) : null) ?? p.avatar_url
  return raw ? withImageVariant(raw, 'avatar') : null
}
