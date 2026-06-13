import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { imageUrl, streamHlsUrl } from '@/lib/media/urls'

/**
 * Shared infrastructure for the professional-services server reads: Cloudflare
 * URL helpers, snake_case row types, the canonical `professional_services`
 * column list + city embed, and small query utilities. Imported by the mappers
 * and every read module.
 */

// ----------------------------------------------------------------------------
// Cloudflare URL helpers (safe — never throw when the account hash is unset)
// ----------------------------------------------------------------------------

const HAS_CF_HASH = Boolean(process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH)

export function cfImage(
  id: string | null | undefined,
  variant: Parameters<typeof imageUrl>[1] = 'public',
): string | undefined {
  if (!id || !HAS_CF_HASH) return undefined
  return imageUrl(id, variant)
}

export function streamPlayback(uid: string): string | undefined {
  try {
    return streamHlsUrl(uid)
  } catch {
    return undefined
  }
}

// ----------------------------------------------------------------------------
// Row types (snake_case as stored in Postgres)
// ----------------------------------------------------------------------------

export interface CityEmbed {
  id: string
  name: string
  slug: string
  state: { id: string; name: string } | null
  country: { id: string; name: string } | null
}

export interface ServiceRow {
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

export interface ProfileRow {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  avatar_cloudflare_id: string | null
  cover_cloudflare_id: string | null
  is_verified: boolean | null
}

export interface SubcategoryRow {
  service_id: string
  subcategory_id: string
  subcategory_name: string
  category_id: string | null
}

export interface MediaRow {
  id: string
  service_id: string
  type: string
  cf_image_id: string | null
  cf_stream_uid: string | null
  caption: string | null
  position: number
  created_at: string
}

export interface ReviewRow {
  id: string
  service_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

export const SERVICE_COLUMNS =
  `id, user_id, professional_profile_id, slug, name, description, category_id, city_id, address,
   logo_cf_image_id, cover_cf_image_id, ad_cf_image_id, business_card_cf_image_id, cv_cf_file_id,
   email, phone, website, facebook_url, instagram_url, twitter_url, linkedin_url, tiktok_url, youtube_url,
   hourly_rate, daily_rate, project_rate, currency, available_for_hire, work_type, tags,
   visibility, status, review_count, average_rating, media_count, created_at, updated_at`

export const CITY_EMBED = `city:cities(id, name, slug, state:states(id, name), country:countries(id, name))`

// ----------------------------------------------------------------------------
// Query utilities
// ----------------------------------------------------------------------------

/** Batch-fetch profile rows for a set of user ids (deduped). */
export async function fetchProfiles(
  client: SupabaseClient,
  ids: Iterable<string>,
): Promise<Map<string, ProfileRow>> {
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
export function sanitizeToken(value: string): string {
  return value.replace(/[,()%{}*\\]/g, ' ').trim()
}

/** URL-safe slug for a state/location name (accent-stripped). */
export function locationSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
