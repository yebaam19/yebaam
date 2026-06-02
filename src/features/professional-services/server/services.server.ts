import 'server-only'

import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

import { getServerClient } from '@/utils/supabase/server'
import { imageUrl, streamThumb, streamHlsUrl } from '@/lib/media/urls'
import { findCategoryById } from '../data/service-categories-taxonomy'
import {
  City,
  ProfessionalService,
  ProfessionalServiceBasic,
  ProfessionalServiceDetailResponse,
  ProfessionalServiceFilters,
  ProfessionalServiceMedia,
  ProfessionalServiceReview,
  ProfessionalServicesListResponse,
  ProfessionalServiceStatus,
  ProfessionalServiceSubcategory,
  ProfessionalServiceVisibility,
  ServiceCity,
  ServiceMediaType,
  ServiceOwner,
  State,
} from '../interfaces/professional-service.interfaces'

// ============================================================================
// CLOUDFLARE URL HELPERS (safe — never throw when the account hash is unset)
// ============================================================================

const HAS_CF_HASH = Boolean(process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH)

function cfImage(id: string | null | undefined, variant: Parameters<typeof imageUrl>[1] = 'public'): string | undefined {
  if (!id || !HAS_CF_HASH) return undefined
  return imageUrl(id, variant)
}

function streamPlayback(uid: string): string | undefined {
  try {
    return streamHlsUrl(uid)
  } catch {
    return undefined
  }
}

// ============================================================================
// ROW TYPES (snake_case as stored in Postgres)
// ============================================================================

interface CityEmbed {
  id: string
  name: string
  slug: string
  state: { id: string; name: string } | null
  country: { id: string; name: string } | null
}

interface ServiceRow {
  id: string
  user_id: string
  professional_profile_id: string | null
  slug: string
  name: string
  description: string | null
  category_id: string | null
  city_id: string | null
  address: string | null
  logo_cf_image_id: string | null
  cover_cf_image_id: string | null
  ad_cf_image_id: string | null
  business_card_cf_image_id: string | null
  cv_cf_file_id: string | null
  email: string | null
  phone: string | null
  website: string | null
  facebook_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  hourly_rate: number | null
  daily_rate: number | null
  project_rate: number | null
  currency: string
  available_for_hire: boolean
  work_type: string[] | null
  tags: string[] | null
  visibility: string
  status: string
  review_count: number
  average_rating: number
  media_count: number
  created_at: string
  updated_at: string
  city?: CityEmbed | null
}

interface ProfileRow {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  avatar_cloudflare_id: string | null
  cover_cloudflare_id: string | null
  is_verified: boolean | null
}

interface SubcategoryRow {
  service_id: string
  subcategory_id: string
  subcategory_name: string
  category_id: string | null
}

interface MediaRow {
  id: string
  service_id: string
  type: string
  cf_image_id: string | null
  cf_stream_uid: string | null
  caption: string | null
  position: number
  created_at: string
}

interface ReviewRow {
  id: string
  service_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

const SERVICE_COLUMNS =
  `id, user_id, professional_profile_id, slug, name, description, category_id, city_id, address,
   logo_cf_image_id, cover_cf_image_id, ad_cf_image_id, business_card_cf_image_id, cv_cf_file_id,
   email, phone, website, facebook_url, instagram_url, twitter_url, linkedin_url, tiktok_url, youtube_url,
   hourly_rate, daily_rate, project_rate, currency, available_for_hire, work_type, tags,
   visibility, status, review_count, average_rating, media_count, created_at, updated_at`

const CITY_EMBED = `city:cities(id, name, slug, state:states(id, name), country:countries(id, name))`

// ============================================================================
// MAPPERS
// ============================================================================

function mapOwner(p: ProfileRow | undefined): ServiceOwner | undefined {
  if (!p) return undefined
  return {
    id: p.id,
    username: p.username ?? '',
    firstName: p.first_name ?? '',
    lastName: p.last_name ?? '',
    avatarUrl: cfImage(p.avatar_cloudflare_id, 'avatar') ?? p.avatar_url ?? undefined,
    coverUrl: cfImage(p.cover_cloudflare_id, 'cover') ?? undefined,
    isVerified: Boolean(p.is_verified),
  }
}

function mapCity(c: CityEmbed | null | undefined): ServiceCity {
  return {
    id: c?.id ?? '',
    name: c?.name ?? '',
    slug: c?.slug ?? '',
    state: c?.state ? { id: c.state.id, name: c.state.name } : undefined,
    country: { id: c?.country?.id ?? '', name: c?.country?.name ?? 'Colombia' },
  }
}

function mapMedia(rows: MediaRow[]): ProfessionalServiceMedia[] {
  return rows
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((m) => {
      const isVideo = m.type === 'VIDEO'
      const url = isVideo
        ? (m.cf_stream_uid ? streamThumb(m.cf_stream_uid) : '')
        : (cfImage(m.cf_image_id) ?? '')
      return {
        id: m.id,
        serviceId: m.service_id,
        type: isVideo ? ServiceMediaType.VIDEO : ServiceMediaType.IMAGE,
        url,
        playbackUrl: isVideo && m.cf_stream_uid ? streamPlayback(m.cf_stream_uid) : undefined,
        caption: m.caption ?? undefined,
        order: m.position,
        createdAt: m.created_at,
      }
    })
}

function mapSubcategories(rows: SubcategoryRow[]): ProfessionalServiceSubcategory[] {
  return rows.map((s) => ({
    id: s.subcategory_id,
    name: s.subcategory_name,
    slug: s.subcategory_id.split('__').pop() ?? s.subcategory_id,
    parentId: s.category_id ?? undefined,
  }))
}

function mapReviews(rows: ReviewRow[], authors: Map<string, ProfileRow>): ProfessionalServiceReview[] {
  return rows.map((r) => {
    const a = authors.get(r.user_id)
    return {
      id: r.id,
      serviceId: r.service_id,
      userId: r.user_id,
      rating: r.rating,
      comment: r.comment ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      user: {
        id: r.user_id,
        username: a?.username ?? '',
        firstName: a?.first_name ?? '',
        lastName: a?.last_name ?? '',
        avatarUrl: cfImage(a?.avatar_cloudflare_id, 'avatar') ?? a?.avatar_url ?? undefined,
      },
    }
  })
}

function mapBasic(row: ServiceRow, owner: ProfileRow | undefined): ProfessionalServiceBasic {
  const category = row.category_id ? findCategoryById(row.category_id) : undefined
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    logoUrl: cfImage(row.logo_cf_image_id) ?? undefined,
    adImageUrl: cfImage(row.ad_cf_image_id) ?? cfImage(row.cover_cf_image_id, 'cover') ?? undefined,
    address: row.address ?? undefined,
    facebookUrl: row.facebook_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    twitterUrl: row.twitter_url ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    hourlyRate: row.hourly_rate ?? undefined,
    currency: row.currency,
    availableForHire: row.available_for_hire,
    category: category ? { id: category.id, name: category.name, iconUrl: category.iconUrl } : undefined,
    city: row.city ? { id: row.city.id, name: row.city.name, slug: row.city.slug } : undefined,
    user: owner
      ? {
          id: owner.id,
          username: owner.username ?? '',
          firstName: owner.first_name ?? '',
          lastName: owner.last_name ?? '',
          avatarUrl: cfImage(owner.avatar_cloudflare_id, 'avatar') ?? owner.avatar_url ?? undefined,
        }
      : undefined,
    _count: { reviews: row.review_count, media: row.media_count },
    averageRating: row.average_rating ?? 0,
  }
}

function mapFull(
  row: ServiceRow,
  owner: ProfileRow | undefined,
  subcategories: SubcategoryRow[],
  media: MediaRow[],
  reviews: ReviewRow[],
  reviewAuthors: Map<string, ProfileRow>,
): ProfessionalService {
  const category = row.category_id ? findCategoryById(row.category_id) : undefined
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    logoUrl: cfImage(row.logo_cf_image_id) ?? undefined,
    coverUrl: cfImage(row.cover_cf_image_id, 'cover') ?? undefined,
    coverImage: cfImage(row.cover_cf_image_id, 'cover') ?? undefined,
    adImageUrl: cfImage(row.ad_cf_image_id) ?? undefined,
    businessCardUrl: cfImage(row.business_card_cf_image_id) ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    address: row.address ?? undefined,
    visibility: (row.visibility as ProfessionalServiceVisibility) ?? ProfessionalServiceVisibility.PUBLIC,
    status: (row.status as ProfessionalServiceStatus) ?? ProfessionalServiceStatus.ACTIVE,
    facebookUrl: row.facebook_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    twitterUrl: row.twitter_url ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    tiktokUrl: row.tiktok_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    hourlyRate: row.hourly_rate ?? undefined,
    dailyRate: row.daily_rate ?? undefined,
    projectRate: row.project_rate ?? undefined,
    currency: row.currency,
    availableForHire: row.available_for_hire,
    workType: row.work_type ?? undefined,
    cvUrl: cfImage(row.cv_cf_file_id) ?? undefined,
    userId: row.user_id,
    cityId: row.city_id ?? '',
    categoryId: row.category_id ?? undefined,
    tags: row.tags ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: mapOwner(owner),
    city: mapCity(row.city),
    category,
    subcategories: mapSubcategories(subcategories),
    media: mapMedia(media),
    reviews: mapReviews(reviews, reviewAuthors),
    _count: { media: row.media_count, reviews: row.review_count },
    averageRating: row.average_rating ?? 0,
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/** Batch-fetch profile rows for a set of user ids. */
async function fetchProfiles(client: SupabaseClient, ids: Iterable<string>): Promise<Map<string, ProfileRow>> {
  const list = Array.from(new Set(Array.from(ids).filter(Boolean)))
  const map = new Map<string, ProfileRow>()
  if (list.length === 0) return map
  const { data } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url, avatar_cloudflare_id, cover_cloudflare_id, is_verified')
    .in('id', list)
  for (const p of (data ?? []) as ProfileRow[]) map.set(p.id, p)
  return map
}

/** Sanitise a free-text token for safe inclusion in a PostgREST `.or()` filter. */
function sanitizeToken(value: string): string {
  return value.replace(/[,()%{}*\\]/g, ' ').trim()
}

/** URL-safe slug for a state/location name (accent-stripped). */
function locationSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ============================================================================
// READS (deduped per-request with react.cache)
// ============================================================================

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

/** Fetch a service's children (owner, subcategories, media, reviews) and map to the full shape. */
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

export const searchServices = cache(
  async (query: string, limit = 10): Promise<ProfessionalServiceBasic[]> => {
    if (!query || query.trim().length < 2) return []
    const { services } = await listServices({ search: query, limit })
    return services
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

// ============================================================================
// LOCATIONS (real cities/states from the city-portal schema)
// ============================================================================

export const getStates = cache(async (): Promise<State[]> => {
  const client = await getServerClient()
  // NOTE: `states` has no FK to `countries` (the country link lives on `cities`),
  // so we do NOT embed countries here — that errors in PostgREST. Country defaults
  // to Colombia (the platform's country), matching the city-portal API.
  const { data, error } = await client
    .from('states')
    .select('id, name')
    .order('name', { ascending: true })
  if (error) console.error('[professional-services] getStates read failed:', error.message)
  return ((data ?? []) as unknown as Array<{ id: string; name: string }>).map((s) => ({
    id: s.id,
    name: s.name,
    slug: locationSlug(s.name),
    country: { id: '', name: 'Colombia' },
  }))
})

export const getAllCities = cache(async (): Promise<City[]> => {
  const client = await getServerClient()
  // Country is embedded directly off `cities` (cities.country_id → countries FK),
  // NOT nested under `state` — `states` has no FK to `countries`.
  const { data, error } = await client
    .from('cities')
    .select('id, name, slug, state_id, state:states(id, name), country:countries(id, name)')
    .order('name', { ascending: true })
  if (error) console.error('[professional-services] getAllCities read failed:', error.message)
  return ((data ?? []) as unknown as Array<{
    id: string
    name: string
    slug: string
    state_id: string | null
    state: { id: string; name: string } | null
    country: { id: string; name: string } | null
  }>).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    stateId: c.state_id ?? '',
    state: c.state
      ? {
          id: c.state.id,
          name: c.state.name,
          slug: locationSlug(c.state.name),
          country: { id: c.country?.id ?? '', name: c.country?.name ?? 'Colombia' },
        }
      : undefined,
  }))
})

export const getCitiesByState = cache(async (stateId: string): Promise<City[]> => {
  const all = await getAllCities()
  return all.filter((c) => c.stateId === stateId)
})

// ============================================================================
// ELIGIBILITY (PDF: only a verified professional profile may publish)
// ============================================================================

export interface ServiceEligibility {
  eligible: boolean
  hasProfile: boolean
  professionalProfileId: string | null
}

export const getMyServiceEligibility = cache(async (): Promise<ServiceEligibility> => {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return { eligible: false, hasProfile: false, professionalProfileId: null }

  const { data: profile } = await client
    .from('professional_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  const professionalProfileId = (profile as { id: string } | null)?.id ?? null

  const { data: eligible } = await client.rpc('has_verified_professional_profile')
  return {
    eligible: Boolean(eligible),
    hasProfile: Boolean(professionalProfileId),
    professionalProfileId,
  }
})
