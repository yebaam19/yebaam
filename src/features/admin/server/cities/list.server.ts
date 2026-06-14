import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/features/cities/server/cf'

/** Admin cities list (with per-city aggregate counts) + the country-filter
 *  options, backing `/admin/ciudades`. */

export interface AdminCityRow {
  id: string
  name: string
  slug: string
  isFeatured: boolean
  followerCount: number
  photoCount: number
  videoCount: number
  postCount: number
  coverImageUrl?: string
  logoUrl?: string
  country: { id: string; code: string; name: string } | null
  state: { id: string; name: string } | null
  newsCount: number
  classifiedsCount: number
  businessesCount: number
  adminCount: number
  createdAt: string
}

export interface CountryOption {
  id: string
  code: string
  name: string
}

export interface ListAdminCitiesResult {
  items: AdminCityRow[]
  total: number
  countries: CountryOption[]
  page: number
  pageSize: number
}

type CityListRow = {
  id: string
  name: string
  slug: string
  is_featured: boolean
  follower_count: number
  photo_count: number
  video_count: number
  post_count: number
  cover_cf_image_id: string | null
  logo_cf_image_id: string | null
  created_at: string
  country: { id: string; code: string | null; name: string } | null
  state: { id: string; name: string } | null
}

const CITY_LIST_SELECT = `id, name, slug, is_featured, follower_count, photo_count, video_count, post_count,
  cover_cf_image_id, logo_cf_image_id, created_at,
  country:countries!inner(id, code, name),
  state:states(id, name)`

async function aggregateCounts(
  cityIds: string[],
): Promise<Record<string, { news: number; classifieds: number; businesses: number; admins: number }>> {
  const out: Record<string, { news: number; classifieds: number; businesses: number; admins: number }> = {}
  for (const id of cityIds) {
    out[id] = { news: 0, classifieds: 0, businesses: 0, admins: 0 }
  }
  if (cityIds.length === 0) return out

  const client = await getServerClient()
  const [news, classifieds, businesses, admins] = await Promise.all([
    client.from('city_news').select('city_id').in('city_id', cityIds),
    client.from('city_classifieds').select('city_id').in('city_id', cityIds),
    client.from('businesses').select('city_id').in('city_id', cityIds),
    client.from('city_admins').select('city_id').in('city_id', cityIds),
  ])
  for (const row of (news.data ?? []) as Array<{ city_id: string }>) {
    if (out[row.city_id]) out[row.city_id].news += 1
  }
  for (const row of (classifieds.data ?? []) as Array<{ city_id: string }>) {
    if (out[row.city_id]) out[row.city_id].classifieds += 1
  }
  for (const row of (businesses.data ?? []) as Array<{ city_id: string }>) {
    if (out[row.city_id]) out[row.city_id].businesses += 1
  }
  for (const row of (admins.data ?? []) as Array<{ city_id: string }>) {
    if (out[row.city_id]) out[row.city_id].admins += 1
  }
  return out
}

export const listAdminCities = cache(async function listAdminCities(params: {
  search?: string
  countryCode?: string
  page?: number
  pageSize?: number
}): Promise<ListAdminCitiesResult> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25))
  const search = (params.search ?? '').trim()
  const countryCode = (params.countryCode ?? '').trim()

  let q = client
    .from('cities')
    .select(CITY_LIST_SELECT, { count: 'exact' })
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true })

  if (search) {
    const escaped = search.replace(/[%,]/g, ' ')
    const like = `%${escaped}%`
    q = q.or(`name.ilike.${like},slug.ilike.${like}`)
  }
  if (countryCode) {
    // Inner join on filter — see fetchCities for the same trick.
    q = q.eq('country.code', countryCode)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await q.range(from, to)
  if (error) {
    console.error('[listAdminCities]', error)
    return { items: [], total: 0, countries: [], page, pageSize }
  }

  const rows = (data ?? []) as unknown as CityListRow[]
  const counts = await aggregateCounts(rows.map((r) => r.id))

  const items: AdminCityRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    isFeatured: Boolean(r.is_featured),
    followerCount: r.follower_count ?? 0,
    photoCount: r.photo_count ?? 0,
    videoCount: r.video_count ?? 0,
    postCount: r.post_count ?? 0,
    coverImageUrl: cfImageUrl(r.cover_cf_image_id),
    logoUrl: cfImageUrl(r.logo_cf_image_id),
    country: r.country
      ? { id: r.country.id, code: r.country.code ?? '', name: r.country.name }
      : null,
    state: r.state ? { id: r.state.id, name: r.state.name } : null,
    newsCount: counts[r.id]?.news ?? 0,
    classifiedsCount: counts[r.id]?.classifieds ?? 0,
    businessesCount: counts[r.id]?.businesses ?? 0,
    adminCount: counts[r.id]?.admins ?? 0,
    createdAt: r.created_at,
  }))

  const countries = await listCountryOptions()

  return { items, total: count ?? 0, countries, page, pageSize }
})

export const listCountryOptions = cache(async function listCountryOptions(): Promise<CountryOption[]> {
  const client = await getServerClient()
  const { data, error } = await client
    .from('countries')
    .select('id, code, name')
    .order('name', { ascending: true })
  if (error) {
    console.error('[listCountryOptions]', error)
    return []
  }
  return ((data ?? []) as Array<{ id: string; code: string; name: string }>).map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
  }))
})
