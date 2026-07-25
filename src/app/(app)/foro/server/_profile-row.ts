import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import { withImageVariant } from '@/lib/media/urls'
import type { ForoAuthor } from '@/features/foro/types'

/**
 * Shared profile row shape + helpers for the foro server modules. The author
 * display rules (display_name → first+last → username → "Usuario") live here so
 * `foro.server.ts`, `admin.server.ts`, and `admin-topics.server.ts` all resolve
 * authors identically.
 */

export const PROFILE_COLUMNS = 'id, username, first_name, last_name, display_name, avatar_url'

export type ProfileRow = {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
}

export function toAuthor(p: ProfileRow | undefined | null): ForoAuthor {
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
    avatarUrl: p.avatar_url ? withImageVariant(p.avatar_url, 'avatar') : null,
  }
}

/**
 * Batch-load profile rows by id into a Map, keyed by id. Dedupes the input and
 * skips empty ids; returns an empty map (no query) when nothing is requested.
 * The single source of truth for "fetch these authors" across the foro layer.
 */
export async function loadProfiles(ids: Iterable<string>): Promise<Map<string, ProfileRow>> {
  const unique = Array.from(new Set(Array.from(ids).filter(Boolean)))
  const map = new Map<string, ProfileRow>()
  if (unique.length === 0) return map
  const client = await getServerClient()
  const { data } = await client.from('profiles').select(PROFILE_COLUMNS).in('id', unique)
  for (const row of (data ?? []) as ProfileRow[]) map.set(row.id, row)
  return map
}
