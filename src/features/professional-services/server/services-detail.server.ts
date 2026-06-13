import 'server-only'

import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

import { getServerClient } from '@/utils/supabase/server'
import { mapFull } from './service-mappers'
import {
  type MediaRow,
  type ReviewRow,
  type ServiceRow,
  type SubcategoryRow,
  CITY_EMBED,
  SERVICE_COLUMNS,
  fetchProfiles,
} from './_shared'
import type {
  ProfessionalService,
  ProfessionalServiceDetailResponse,
} from '../interfaces/professional-service.interfaces'

/** Fetch a service's children (owner, subcategories, media, reviews) and map to
 *  the full domain shape. */
async function hydrate(client: SupabaseClient, row: ServiceRow): Promise<ProfessionalService> {
  const [ownerMap, subcatRes, mediaRes, reviewRes] = await Promise.all([
    fetchProfiles(client, [row.user_id]),
    client.from('professional_service_subcategories').select('service_id, subcategory_id, subcategory_name, category_id').eq('service_id', row.id),
    client.from('professional_service_media').select('id, service_id, type, cf_image_id, cf_stream_uid, caption, position, created_at').eq('service_id', row.id),
    client.from('professional_service_reviews').select('id, service_id, user_id, rating, comment, created_at, updated_at').eq('service_id', row.id).order('created_at', { ascending: false }),
  ])
  const reviews = (reviewRes.data ?? []) as ReviewRow[]
  const reviewAuthors = await fetchProfiles(client, reviews.map((r) => r.user_id))
  return mapFull(
    row,
    ownerMap.get(row.user_id),
    (subcatRes.data ?? []) as SubcategoryRow[],
    (mediaRes.data ?? []) as MediaRow[],
    reviews,
    reviewAuthors,
  )
}

export const getServiceBySlug = cache(
  async (slug: string): Promise<ProfessionalServiceDetailResponse | null> => {
    const client = await getServerClient()
    const { data, error } = await client
      .from('professional_services')
      .select(`${SERVICE_COLUMNS}, ${CITY_EMBED}`)
      .eq('slug', slug)
      .maybeSingle()
    if (error) console.error('[professional-services] getServiceBySlug read failed:', error.message)
    if (!data) return null
    return { service: await hydrate(client, data as unknown as ServiceRow) }
  },
)

export const getServiceById = cache(
  async (id: string): Promise<ProfessionalServiceDetailResponse | null> => {
    const client = await getServerClient()
    const { data, error } = await client
      .from('professional_services')
      .select(`${SERVICE_COLUMNS}, ${CITY_EMBED}`)
      .eq('id', id)
      .maybeSingle()
    if (error) console.error('[professional-services] getServiceById read failed:', error.message)
    if (!data) return null
    return { service: await hydrate(client, data as unknown as ServiceRow) }
  },
)
