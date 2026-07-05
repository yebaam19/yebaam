import 'server-only'

import { cache } from 'react'

import { getServerClient } from '@/utils/supabase/server'
import { mapBasic } from './service-mappers'
import {
  type ServiceRow,
  CITY_EMBED,
  fetchProfiles,
  sanitizeToken,
} from './_shared'
import type {
  ProfessionalServiceBasic,
  ProfessionalServiceFilters,
  ProfessionalServicesListResponse,
} from '../interfaces/professional-service.interfaces'

// ----------------------------------------------------------------------------
// Anti-scraping guards
// ----------------------------------------------------------------------------

/** Hard cap on rows per page for list/search surfaces. */
const MAX_LIST_LIMIT = 48
/** Hard cap on pagination depth — blocks bulk directory walks. */
const MAX_LIST_PAGE = 500

function clampLimit(value: number | undefined, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback
  return Math.min(Math.max(n, 1), MAX_LIST_LIMIT)
}

function clampPage(value: number | undefined): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 1
  return Math.min(Math.max(n, 1), MAX_LIST_PAGE)
}

/** Columns for list/search surfaces: like `SERVICE_COLUMNS` but WITHOUT
 *  `email`/`phone` — contact data is only exposed by the detail read, never on
 *  paginated surfaces that are trivial to scrape. `mapBasic` never reads those
 *  two fields, so casting the rows to `ServiceRow` stays safe at runtime. */
const LIST_COLUMNS = `id, user_id, professional_profile_id, slug, name, description, category_id, city_id, address,
   logo_cf_image_id, cover_cf_image_id, ad_cf_image_id, business_card_cf_image_id, cv_cf_file_id,
   website, facebook_url, instagram_url, twitter_url, linkedin_url, tiktok_url, youtube_url,
   hourly_rate, daily_rate, project_rate, currency, available_for_hire, work_type, tags,
   visibility, status, review_count, average_rating, media_count, created_at, updated_at`

export const listServices = cache(
  async (filters: ProfessionalServiceFilters = {}): Promise<ProfessionalServicesListResponse> => {
    const client = await getServerClient()
    const { search, categoryId, subcategoryId, cityId, stateId, minRating, availableForHire } = filters
    const page = clampPage(filters.page)
    const limit = clampLimit(filters.limit, 24)

    const needsCityJoin = Boolean(stateId)
    const cityClause = needsCityJoin
      ? `city:cities!inner(id, name, slug, state:states(id, name), country:countries(id, name))`
      : CITY_EMBED
    const subcatClause = subcategoryId ? `, sub:professional_service_subcategories!inner(subcategory_id)` : ''

    let q = client
      .from('professional_services')
      .select(`${LIST_COLUMNS}, ${cityClause}${subcatClause}`, { count: 'exact' })
      .eq('status', 'ACTIVE')
      .eq('visibility', 'PUBLIC')

    if (search) {
      const token = sanitizeToken(search)
      if (token) q = q.or(`name.ilike.%${token}%,description.ilike.%${token}%,tags.cs.{${token.toLowerCase()}}`)
    }
    if (categoryId) q = q.eq('category_id', categoryId)
    if (subcategoryId) q = q.eq('sub.subcategory_id', subcategoryId)
    if (cityId) q = q.eq('city_id', cityId)
    if (stateId) q = q.eq('city.state_id', stateId)
    if (minRating !== undefined) q = q.gte('average_rating', minRating)
    if (availableForHire !== undefined) q = q.eq('available_for_hire', availableForHire)

    const from = (page - 1) * limit
    q = q.order('created_at', { ascending: false }).range(from, from + limit - 1)

    const { data, count, error } = await q
    if (error) console.error('[professional-services] listServices read failed:', error.message)
    const rows = (data ?? []) as unknown as ServiceRow[]
    const owners = await fetchProfiles(client, rows.map((r) => r.user_id))
    const total = count ?? rows.length
    return {
      services: rows.map((r) => mapBasic(r, owners.get(r.user_id))),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  },
)

export const getFeaturedServices = cache(
  async (limit = 6): Promise<ProfessionalServiceBasic[]> => {
    const client = await getServerClient()
    const { data } = await client
      .from('professional_services')
      .select(`${LIST_COLUMNS}, ${CITY_EMBED}`)
      .eq('status', 'ACTIVE')
      .eq('visibility', 'PUBLIC')
      .order('average_rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(clampLimit(limit, 6))
    const rows = (data ?? []) as unknown as ServiceRow[]
    const owners = await fetchProfiles(client, rows.map((r) => r.user_id))
    return rows.map((r) => mapBasic(r, owners.get(r.user_id)))
  },
)

export const getRecentServices = cache(
  async (limit = 10): Promise<ProfessionalServiceBasic[]> => {
    const { services } = await listServices({ limit })
    return services
  },
)

export const getServiceStats = cache(
  async (serviceId: string): Promise<{ totalReviews: number; averageRating: number; totalMedia: number }> => {
    const client = await getServerClient()
    const { data } = await client
      .from('professional_services')
      .select('review_count, average_rating, media_count')
      .eq('id', serviceId)
      .maybeSingle()
    const row = data as { review_count: number; average_rating: number; media_count: number } | null
    return {
      totalReviews: row?.review_count ?? 0,
      averageRating: row?.average_rating ?? 0,
      totalMedia: row?.media_count ?? 0,
    }
  },
)

/** A user's own services (for the "Mis servicios" profile tab). Includes
 *  non-public rows only when `includePrivate` (RLS still gates cross-user reads). */
export const getServicesByUserId = cache(
  async (userId: string, includePrivate = false): Promise<ProfessionalServiceBasic[]> => {
    const client = await getServerClient()
    let q = client
      .from('professional_services')
      .select(`${LIST_COLUMNS}, ${CITY_EMBED}`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!includePrivate) q = q.eq('status', 'ACTIVE').eq('visibility', 'PUBLIC')
    const { data } = await q
    const rows = (data ?? []) as unknown as ServiceRow[]
    const owners = await fetchProfiles(client, rows.map((r) => r.user_id))
    return rows.map((r) => mapBasic(r, owners.get(r.user_id)))
  },
)
