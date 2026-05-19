import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/features/cities/server/cf'

/**
 * Server reads that back the `/admin/ciudades/**` views. Every export is
 * `cache()`-wrapped so the list, the toolbar's country filter, and the
 * editor's per-tab fetches share at most one DB hit per request.
 *
 * Authorization: pages call `requirePlatformAdmin()` (see ./auth) before
 * reaching these. The RLS on `cities`/`city_admins`/`city_news` is permissive
 * for platform admins, so the queries themselves don't carry an extra gate.
 */

// ---------- Cities list ----------

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
  country:countries(id, code, name),
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

// ---------- Single city detail ----------

export interface AdminCityDetail {
  id: string
  name: string
  slug: string
  description: string
  history_md: string
  economy_md: string
  is_featured: boolean
  follower_count: number
  photo_count: number
  video_count: number
  post_count: number
  cover_cf_image_id: string | null
  logo_cf_image_id: string | null
  cover_image_url?: string
  logo_image_url?: string
  population: number | null
  altitude_m: number | null
  founded_year: number | null
  department: string | null
  country: { id: string; code: string; name: string } | null
  state: { id: string; name: string } | null
  created_at: string
  updated_at: string
}

export const getAdminCityBySlug = cache(async function getAdminCityBySlug(
  slug: string,
): Promise<AdminCityDetail | null> {
  const client = await getServerClient()
  const { data, error } = await client
    .from('cities')
    .select(
      `id, name, slug, description, history_md, economy_md, is_featured,
       follower_count, photo_count, video_count, post_count,
       cover_cf_image_id, logo_cf_image_id, population, altitude_m, founded_year, department,
       created_at, updated_at,
       country:countries(id, code, name),
       state:states(id, name)`,
    )
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('[getAdminCityBySlug]', error)
    return null
  }
  if (!data) return null
  const row = data as unknown as {
    id: string
    name: string
    slug: string
    description: string
    history_md: string
    economy_md: string
    is_featured: boolean
    follower_count: number
    photo_count: number
    video_count: number
    post_count: number
    cover_cf_image_id: string | null
    logo_cf_image_id: string | null
    population: number | null
    altitude_m: number | null
    founded_year: number | null
    department: string | null
    created_at: string
    updated_at: string
    country: { id: string; code: string | null; name: string } | null
    state: { id: string; name: string } | null
  }
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    history_md: row.history_md ?? '',
    economy_md: row.economy_md ?? '',
    is_featured: Boolean(row.is_featured),
    follower_count: row.follower_count ?? 0,
    photo_count: row.photo_count ?? 0,
    video_count: row.video_count ?? 0,
    post_count: row.post_count ?? 0,
    cover_cf_image_id: row.cover_cf_image_id,
    logo_cf_image_id: row.logo_cf_image_id,
    cover_image_url: cfImageUrl(row.cover_cf_image_id),
    logo_image_url: cfImageUrl(row.logo_cf_image_id),
    population: row.population,
    altitude_m: row.altitude_m,
    founded_year: row.founded_year,
    department: row.department,
    country: row.country
      ? { id: row.country.id, code: row.country.code ?? '', name: row.country.name }
      : null,
    state: row.state ? { id: row.state.id, name: row.state.name } : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
})

// ---------- City admins ----------

export interface CityAdminRow {
  userId: string
  cityId: string
  role: 'owner' | 'franchise' | 'contractor'
  grantedAt: string
  user: {
    id: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
  }
}

type ProfileLite = {
  id: string
  username: string | null
  display_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  avatar_cloudflare_id: string | null
}

async function fetchProfilesByIds(
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

function profileToDisplay(p: ProfileLite | undefined | null): string | null {
  if (!p) return null
  if (p.display_name) return p.display_name
  const composed = [p.first_name, p.last_name].filter(Boolean).join(' ')
  if (composed) return composed
  return p.username
}

function profileToAvatar(p: ProfileLite | undefined | null): string | null {
  if (!p) return null
  if (p.avatar_cloudflare_id) return cfImageUrl(p.avatar_cloudflare_id) ?? p.avatar_url
  return p.avatar_url
}

export const listCityAdmins = cache(async function listCityAdmins(
  cityId: string,
): Promise<CityAdminRow[]> {
  const client = await getServerClient()
  const { data, error } = await client
    .from('city_admins')
    .select('city_id, user_id, role, granted_at')
    .eq('city_id', cityId)
    .order('granted_at', { ascending: true })
  if (error) {
    console.error('[listCityAdmins]', error)
    return []
  }
  type Row = {
    city_id: string
    user_id: string
    role: 'owner' | 'franchise' | 'contractor'
    granted_at: string
  }
  const rows = (data ?? []) as Row[]
  const profiles = await fetchProfilesByIds(rows.map((r) => r.user_id))
  return rows.map((r) => {
    const p = profiles.get(r.user_id) ?? null
    return {
      userId: r.user_id,
      cityId: r.city_id,
      role: r.role,
      grantedAt: r.granted_at,
      user: {
        id: r.user_id,
        username: p?.username ?? null,
        displayName: profileToDisplay(p),
        avatarUrl: profileToAvatar(p),
      },
    }
  })
})

// ---------- Discovery thumbnails ----------

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

// ---------- Per-city moderation lists ----------

export interface AdminNewsRow {
  id: string
  title: string
  status: 'pending' | 'approved' | 'rejected'
  coverImageUrl?: string
  authorId: string | null
  authorName: string | null
  sourceName: string | null
  publishedAt: string | null
  createdAt: string
}

export interface AdminClassifiedRow {
  id: string
  title: string
  status: 'open' | 'sold' | 'closed'
  kind: 'offer' | 'want' | 'trade' | 'free'
  priceCents: number | null
  currency: string
  authorId: string | null
  authorName: string | null
  createdAt: string
}

export interface AdminContactMessageRow {
  id: string
  subject: string | null
  body: string
  status: 'new' | 'read' | 'resolved'
  senderId: string | null
  senderName: string | null
  createdAt: string
}

export type PaginatedList<T> = { items: T[]; total: number; page: number; pageSize: number }

export const listCityNewsForAdmin = cache(async function listCityNewsForAdmin(
  cityId: string,
  params: { status?: 'pending' | 'approved' | 'rejected'; page?: number; pageSize?: number },
): Promise<PaginatedList<AdminNewsRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20))
  let q = client
    .from('city_news')
    .select(
      'id, title, status, cover_cf_image_id, author_id, source_name, published_at, created_at',
      { count: 'exact' },
    )
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
  if (params.status) q = q.eq('status', params.status)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await q.range(from, to)
  if (error) {
    console.error('[listCityNewsForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = {
    id: string
    title: string
    status: 'pending' | 'approved' | 'rejected'
    cover_cf_image_id: string | null
    author_id: string | null
    source_name: string | null
    published_at: string | null
    created_at: string
  }
  const rows = (data ?? []) as Row[]
  const profiles = await fetchProfilesByIds(rows.map((r) => r.author_id))
  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    coverImageUrl: cfImageUrl(r.cover_cf_image_id),
    authorId: r.author_id,
    authorName: profileToDisplay(r.author_id ? profiles.get(r.author_id) : null),
    sourceName: r.source_name,
    publishedAt: r.published_at,
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})

export const listCityClassifiedsForAdmin = cache(async function listCityClassifiedsForAdmin(
  cityId: string,
  params: { status?: 'open' | 'sold' | 'closed'; page?: number; pageSize?: number },
): Promise<PaginatedList<AdminClassifiedRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20))
  let q = client
    .from('city_classifieds')
    .select(
      'id, title, status, kind, price_cents, currency, author_id, created_at',
      { count: 'exact' },
    )
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
  if (params.status) q = q.eq('status', params.status)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await q.range(from, to)
  if (error) {
    console.error('[listCityClassifiedsForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = {
    id: string
    title: string
    status: 'open' | 'sold' | 'closed'
    kind: 'offer' | 'want' | 'trade' | 'free'
    price_cents: number | null
    currency: string
    author_id: string | null
    created_at: string
  }
  const rows = (data ?? []) as Row[]
  const profiles = await fetchProfilesByIds(rows.map((r) => r.author_id))
  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    kind: r.kind,
    priceCents: r.price_cents,
    currency: r.currency,
    authorId: r.author_id,
    authorName: profileToDisplay(r.author_id ? profiles.get(r.author_id) : null),
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})

export const listCityContactMessagesForAdmin = cache(async function listCityContactMessagesForAdmin(
  cityId: string,
  params: { status?: 'new' | 'read' | 'resolved'; page?: number; pageSize?: number },
): Promise<PaginatedList<AdminContactMessageRow>> {
  const client = await getServerClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20))
  let q = client
    .from('city_contact_messages')
    .select('id, subject, body, status, sender_id, created_at', { count: 'exact' })
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
  if (params.status) q = q.eq('status', params.status)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await q.range(from, to)
  if (error) {
    console.error('[listCityContactMessagesForAdmin]', error)
    return { items: [], total: 0, page, pageSize }
  }
  type Row = {
    id: string
    subject: string | null
    body: string
    status: 'new' | 'read' | 'resolved'
    sender_id: string | null
    created_at: string
  }
  const rows = (data ?? []) as Row[]
  const profiles = await fetchProfilesByIds(rows.map((r) => r.sender_id))
  const items = rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    body: r.body,
    status: r.status,
    senderId: r.sender_id,
    senderName: profileToDisplay(r.sender_id ? profiles.get(r.sender_id) : null),
    createdAt: r.created_at,
  }))
  return { items, total: count ?? 0, page, pageSize }
})

// ---------- States by country (for create form) ----------

export interface StateOption {
  id: string
  name: string
}

export const listStatesByCountryCode = cache(async function listStatesByCountryCode(
  countryCode: string,
): Promise<StateOption[]> {
  if (!countryCode) return []
  const client = await getServerClient()
  const { data, error } = await client
    .from('states')
    .select('id, name')
    .eq('country_code', countryCode)
    .order('name', { ascending: true })
  if (error) {
    console.error('[listStatesByCountryCode]', error)
    return []
  }
  return ((data ?? []) as Array<{ id: string; name: string }>).map((r) => ({
    id: r.id,
    name: r.name,
  }))
})
