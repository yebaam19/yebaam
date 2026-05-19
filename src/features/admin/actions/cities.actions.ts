'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'

/**
 * Admin-only server actions for the `/admin/ciudades/**` views.
 *
 * Every export starts with `await requirePlatformAdmin()` so a non-admin
 * navigating directly to the action endpoint is redirected instead of
 * mutating state. The RLS on `cities`/`city_admins`/`discovery_thumbnails`
 * is permissive for platform admins, so these queries don't need the
 * service-role key.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function validateSlug(slug: string): string | null {
  if (!slug) return 'slug_required'
  if (slug.length < 2 || slug.length > 80) return 'slug_length'
  if (!SLUG_RE.test(slug)) return 'slug_format'
  return null
}

// ---------- City CRUD ----------

export interface CreateCityInput {
  name: string
  slug?: string
  countryId: string
  stateId?: string | null
}

export async function createCity(
  input: CreateCityInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requirePlatformAdmin()
  const name = (input.name ?? '').trim()
  if (!name) return { ok: false, error: 'name_required' }
  if (!input.countryId) return { ok: false, error: 'country_required' }
  const slug = (input.slug?.trim() || slugify(name))
  const slugErr = validateSlug(slug)
  if (slugErr) return { ok: false, error: slugErr }

  const client = await getServerClient()
  const { data: existing } = await client
    .from('cities')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) return { ok: false, error: 'slug_taken' }

  const { data, error } = await client
    .from('cities')
    .insert({
      name,
      slug,
      country_id: input.countryId,
      state_id: input.stateId ?? null,
      description: '',
      history_md: '',
      economy_md: '',
      is_featured: false,
    })
    .select('id, slug')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }

  revalidatePath('/admin/ciudades')
  revalidatePath('/cities')
  return { ok: true, data: { id: data.id as string, slug: data.slug as string } }
}

export interface UpdateCityMetadataInput {
  cityId: string
  name: string
  slug: string
  description: string
  history_md: string
  economy_md: string
  is_featured: boolean
  department?: string | null
  population?: number | null
  altitude_m?: number | null
  founded_year?: number | null
}

export async function updateCityMetadata(
  input: UpdateCityMetadataInput,
): Promise<ActionResult<{ slug: string }>> {
  await requirePlatformAdmin()
  if (!input.cityId) return { ok: false, error: 'city_required' }
  const name = (input.name ?? '').trim()
  if (!name) return { ok: false, error: 'name_required' }
  const slug = (input.slug ?? '').trim()
  const slugErr = validateSlug(slug)
  if (slugErr) return { ok: false, error: slugErr }

  const client = await getServerClient()
  const { data: clash } = await client
    .from('cities')
    .select('id')
    .eq('slug', slug)
    .neq('id', input.cityId)
    .maybeSingle()
  if (clash) return { ok: false, error: 'slug_taken' }

  const { data: prev } = await client
    .from('cities')
    .select('slug')
    .eq('id', input.cityId)
    .maybeSingle()

  const { error } = await client
    .from('cities')
    .update({
      name,
      slug,
      description: input.description ?? '',
      history_md: input.history_md ?? '',
      economy_md: input.economy_md ?? '',
      is_featured: Boolean(input.is_featured),
      department: input.department ?? null,
      population: typeof input.population === 'number' ? input.population : null,
      altitude_m: typeof input.altitude_m === 'number' ? input.altitude_m : null,
      founded_year: typeof input.founded_year === 'number' ? input.founded_year : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.cityId)
  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/ciudades')
  revalidatePath(`/admin/ciudades/${slug}`)
  if (prev && (prev as { slug: string }).slug !== slug) {
    revalidatePath(`/admin/ciudades/${(prev as { slug: string }).slug}`)
    revalidatePath(`/cities/${(prev as { slug: string }).slug}`)
  }
  revalidatePath(`/cities/${slug}`)
  revalidatePath('/cities')
  return { ok: true, data: { slug } }
}

async function setCityImage(
  cityId: string,
  field: 'cover_cf_image_id' | 'logo_cf_image_id',
  cfImageId: string | null,
): Promise<ActionResult<{ id: string | null }>> {
  await requirePlatformAdmin()
  if (!cityId) return { ok: false, error: 'city_required' }
  const client = await getServerClient()
  const { data: row, error } = await client
    .from('cities')
    .update({ [field]: cfImageId, updated_at: new Date().toISOString() })
    .eq('id', cityId)
    .select('slug')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!row) return { ok: false, error: 'not_found' }
  const slug = (row as { slug: string }).slug
  revalidatePath('/admin/ciudades')
  revalidatePath(`/admin/ciudades/${slug}`)
  revalidatePath(`/cities/${slug}`)
  revalidatePath('/cities')
  return { ok: true, data: { id: cfImageId } }
}

export async function setCityCover(cityId: string, cfImageId: string | null) {
  return setCityImage(cityId, 'cover_cf_image_id', cfImageId)
}

export async function setCityLogo(cityId: string, cfImageId: string | null) {
  return setCityImage(cityId, 'logo_cf_image_id', cfImageId)
}

// ---------- City admins ----------

const VALID_ROLES = new Set(['owner', 'franchise', 'contractor'])

export interface GrantCityAdminInput {
  cityId: string
  userId: string
  role: 'owner' | 'franchise' | 'contractor'
}

export async function grantCityAdmin(input: GrantCityAdminInput): Promise<ActionResult<{ userId: string }>> {
  await requirePlatformAdmin()
  if (!input.cityId || !input.userId) return { ok: false, error: 'missing_input' }
  if (!VALID_ROLES.has(input.role)) return { ok: false, error: 'invalid_role' }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()

  const { data: existing } = await client
    .from('city_admins')
    .select('user_id')
    .eq('city_id', input.cityId)
    .eq('user_id', input.userId)
    .maybeSingle()
  if (existing) return { ok: false, error: 'already_granted' }

  const { error } = await client.from('city_admins').insert({
    city_id: input.cityId,
    user_id: input.userId,
    role: input.role,
    granted_by: auth?.user?.id ?? null,
  })
  if (error) return { ok: false, error: error.message }

  const { data: city } = await client
    .from('cities')
    .select('slug')
    .eq('id', input.cityId)
    .maybeSingle()
  if (city) revalidatePath(`/admin/ciudades/${(city as { slug: string }).slug}`)
  return { ok: true, data: { userId: input.userId } }
}

export async function revokeCityAdmin(input: {
  cityId: string
  userId: string
}): Promise<ActionResult<{ userId: string }>> {
  await requirePlatformAdmin()
  if (!input.cityId || !input.userId) return { ok: false, error: 'missing_input' }
  const client = await getServerClient()
  const { error } = await client
    .from('city_admins')
    .delete()
    .eq('city_id', input.cityId)
    .eq('user_id', input.userId)
  if (error) return { ok: false, error: error.message }

  const { data: city } = await client
    .from('cities')
    .select('slug')
    .eq('id', input.cityId)
    .maybeSingle()
  if (city) revalidatePath(`/admin/ciudades/${(city as { slug: string }).slug}`)
  return { ok: true, data: { userId: input.userId } }
}

export interface LookupUserResult {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
}

export async function lookupUserByUsername(username: string): Promise<ActionResult<LookupUserResult>> {
  await requirePlatformAdmin()
  const clean = (username ?? '').replace(/^@/, '').trim()
  if (!clean) return { ok: false, error: 'username_required' }
  const client = await getServerClient()
  const { data, error } = await client
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, avatar_url')
    .ilike('username', clean)
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }
  type Row = {
    id: string
    username: string | null
    display_name: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
  const row = data as Row
  const display =
    row.display_name ?? [row.first_name, row.last_name].filter(Boolean).join(' ') ?? null
  return {
    ok: true,
    data: {
      id: row.id,
      username: row.username,
      displayName: display,
      avatarUrl: row.avatar_url,
    },
  }
}

// ---------- Discovery thumbnails ----------

export async function upsertDiscoveryThumbnail(input: {
  category: string
  cfImageId: string
}): Promise<ActionResult<{ category: string }>> {
  await requirePlatformAdmin()
  const category = (input.category ?? '').trim()
  const cfImageId = (input.cfImageId ?? '').trim()
  if (!category) return { ok: false, error: 'category_required' }
  if (!cfImageId) return { ok: false, error: 'image_required' }

  const client = await getServerClient()
  const { error } = await client
    .from('discovery_thumbnails')
    .upsert({ category, cf_image_id: cfImageId }, { onConflict: 'category' })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/ciudades/thumbnails')
  revalidatePath('/cities/[slug]', 'page')
  return { ok: true, data: { category } }
}

export async function deleteDiscoveryThumbnail(
  category: string,
): Promise<ActionResult<{ category: string }>> {
  await requirePlatformAdmin()
  const clean = (category ?? '').trim()
  if (!clean) return { ok: false, error: 'category_required' }
  const client = await getServerClient()
  const { error } = await client.from('discovery_thumbnails').delete().eq('category', clean)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/ciudades/thumbnails')
  revalidatePath('/cities/[slug]', 'page')
  return { ok: true, data: { category: clean } }
}

// ---------- Per-city moderation ----------

const NEWS_STATUSES = new Set(['pending', 'approved', 'rejected'])
const CLASSIFIED_STATUSES = new Set(['open', 'sold', 'closed'])
const CONTACT_STATUSES = new Set(['new', 'read', 'resolved'])

export async function setCityNewsStatus(input: {
  newsId: string
  status: 'pending' | 'approved' | 'rejected'
}): Promise<ActionResult<{ id: string; status: string }>> {
  await requirePlatformAdmin()
  if (!input.newsId) return { ok: false, error: 'missing_input' }
  if (!NEWS_STATUSES.has(input.status)) return { ok: false, error: 'invalid_status' }
  const client = await getServerClient()
  const { data, error } = await client
    .from('city_news')
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq('id', input.newsId)
    .select('id, status, city_id, cities:city_id(slug)')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }
  const row = data as unknown as {
    id: string
    status: string
    city_id: string
    cities: { slug: string } | null
  }
  if (row.cities?.slug) {
    revalidatePath(`/admin/ciudades/${row.cities.slug}`)
    revalidatePath(`/cities/${row.cities.slug}/news`)
  }
  return { ok: true, data: { id: row.id, status: row.status } }
}

export async function setCityClassifiedStatus(input: {
  classifiedId: string
  status: 'open' | 'sold' | 'closed'
}): Promise<ActionResult<{ id: string; status: string }>> {
  await requirePlatformAdmin()
  if (!input.classifiedId) return { ok: false, error: 'missing_input' }
  if (!CLASSIFIED_STATUSES.has(input.status)) return { ok: false, error: 'invalid_status' }
  const client = await getServerClient()
  const { data, error } = await client
    .from('city_classifieds')
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq('id', input.classifiedId)
    .select('id, status, city_id, cities:city_id(slug)')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }
  const row = data as unknown as {
    id: string
    status: string
    city_id: string
    cities: { slug: string } | null
  }
  if (row.cities?.slug) {
    revalidatePath(`/admin/ciudades/${row.cities.slug}`)
    revalidatePath(`/cities/${row.cities.slug}/classifieds`)
  }
  return { ok: true, data: { id: row.id, status: row.status } }
}

export async function setCityContactMessageStatus(input: {
  messageId: string
  status: 'new' | 'read' | 'resolved'
}): Promise<ActionResult<{ id: string; status: string }>> {
  await requirePlatformAdmin()
  if (!input.messageId) return { ok: false, error: 'missing_input' }
  if (!CONTACT_STATUSES.has(input.status)) return { ok: false, error: 'invalid_status' }
  const client = await getServerClient()
  const { data, error } = await client
    .from('city_contact_messages')
    .update({ status: input.status })
    .eq('id', input.messageId)
    .select('id, status, city_id, cities:city_id(slug)')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }
  const row = data as unknown as {
    id: string
    status: string
    city_id: string
    cities: { slug: string } | null
  }
  if (row.cities?.slug) {
    revalidatePath(`/admin/ciudades/${row.cities.slug}`)
    revalidatePath(`/cities/${row.cities.slug}/contact`)
  }
  return { ok: true, data: { id: row.id, status: row.status } }
}
