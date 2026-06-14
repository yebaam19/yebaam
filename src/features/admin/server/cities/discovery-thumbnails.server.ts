import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'

/** Discovery thumbnail image ids by category, backing `/admin/ciudades/thumbnails`. */

export const getDiscoveryThumbnailsAdmin = cache(async function getDiscoveryThumbnailsAdmin(): Promise<
  Record<string, string>
> {
  const client = await getServerClient()
  const { data, error } = await client
    .from('discovery_thumbnails')
    .select('category, cf_image_id')
  if (error) {
    console.error('[getDiscoveryThumbnailsAdmin]', error)
    return {}
  }
  const out: Record<string, string> = {}
  for (const r of (data ?? []) as Array<{ category: string; cf_image_id: string }>) {
    out[r.category] = r.cf_image_id
  }
  return out
})
