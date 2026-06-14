import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/features/cities/server/cf'
import { fetchProfilesByIds, profileToDisplay, profileToAvatar } from './_shared.server'

/** Single-city detail read + the city's admin roster, backing the city editor. */

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
