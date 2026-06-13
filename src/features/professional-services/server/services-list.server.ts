import 'server-only'

import { cache } from 'react'

import { getServerClient } from '@/utils/supabase/server'
import { mapBasic } from './service-mappers'
import {
  type ServiceRow,
  CITY_EMBED,
  SERVICE_COLUMNS,
  fetchProfiles,
  sanitizeToken,
} from './_shared'
import type {
  ProfessionalServiceBasic,
  ProfessionalServiceFilters,
  ProfessionalServicesListResponse,
} from '../interfaces/professional-service.interfaces'

export const listServices = cache(
  async (filters: ProfessionalServiceFilters = {}): Promise<ProfessionalServicesListResponse> => {
    const client = await getServerClient()
    const { search, categoryId, subcategoryId, cityId, stateId, minRating, availableForHire, page = 1, limit = 24 } = filters

    const needsCityJoin = Boolean(stateId)
    const cityClause = needsCityJoin
      ? `city:cities!inner(id, name, slug, state:states(id, name), country:countries(id, name))`
      : CITY_EMBED
    const subcatClause = subcategoryId ? `, sub:professional_service_subcategories!inner(subcategory_id)` : ''

    let q = client
      .from('professional_services')
      .select(`${SERVICE_COLUMNS}, ${cityClause}${subcatClause}`, { count: 'exact' })
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
      .select(`${SERVICE_COLUMNS}, ${CITY_EMBED}`)
      .eq('status', 'ACTIVE')
      .eq('visibility', 'PUBLIC')
      .order('average_rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(limit)
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
      .select(`${SERVICE_COLUMNS}, ${CITY_EMBED}`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (!includePrivate) q = q.eq('status', 'ACTIVE').eq('visibility', 'PUBLIC')
    const { data } = await q
    const rows = (data ?? []) as unknown as ServiceRow[]
    const owners = await fetchProfiles(client, rows.map((r) => r.user_id))
    return rows.map((r) => mapBasic(r, owners.get(r.user_id)))
  },
)
