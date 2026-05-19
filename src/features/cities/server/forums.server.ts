import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerClient } from '@/utils/supabase/server'

/**
 * Resolve the forum_space slug for a city (owner_type='city', owner_id=cityId).
 * Returns `null` when the city has no space yet — callers should fall back to a
 * polished empty state. `createCity` provisions one automatically, so this
 * should only return null for cities created before that wiring landed.
 */
export async function fetchCityForumSpaceSlug(
  client: SupabaseClient,
  cityId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from('forum_spaces')
    .select('slug')
    .eq('owner_type', 'city')
    .eq('owner_id', cityId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[fetchCityForumSpaceSlug]', error)
    return null
  }
  return data ? (data as { slug: string }).slug : null
}

export const getCityForumSpaceSlug = cache(async (cityId: string) => {
  const client = await getServerClient()
  return fetchCityForumSpaceSlug(client, cityId)
})
