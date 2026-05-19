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

  // Auto-provision the city's forum_space + four default categories
  // (General / Política / Deportes / Sociales — matches the PDF item 8).
  // Failure here is logged but doesn't roll the city back; admins can
  // re-create the space manually if needed.
  const cityId = data.id as string
  const citySlug = data.slug as string
  const spaceSlug = `city-${citySlug}`
  const { data: spaceRow, error: spaceErr } = await client
    .from('forum_spaces')
    .insert({
      owner_type: 'city',
      owner_id: cityId,
      slug: spaceSlug,
      name,
      description: `Foros públicos de ${name}`,
      visibility: 'public',
      enabled: true,
    })
    .select('id')
    .maybeSingle()
  if (spaceErr) {
    console.error('[createCity] could not create forum_space:', spaceErr)
  } else if (spaceRow) {
    const spaceId = (spaceRow as { id: string }).id
    const { error: catErr } = await client.from('forum_categories').insert(
      [
        { name: 'General', slug: `${spaceSlug}-general`, position: 1 },
        { name: 'Política', slug: `${spaceSlug}-politica`, position: 2 },
        { name: 'Deportes', slug: `${spaceSlug}-deportes`, position: 3 },
        { name: 'Sociales', slug: `${spaceSlug}-sociales`, position: 4 },
      ].map((c) => ({ ...c, space_id: spaceId })),
    )
    if (catErr) console.error('[createCity] could not seed categories:', catErr)
  }

  revalidatePath('/admin/ciudades')
  revalidatePath('/cities')
  return { ok: true, data: { id: cityId, slug: citySlug } }
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

// ---------- Per-city places (admin CRUD) ----------

const PLACE_STATUSES = new Set(['pending', 'approved', 'rejected'])

export interface UpsertCityPlaceInput {
  cityId: string
  placeId?: string
  name: string
  description?: string | null
  cfImageId?: string | null
  category?: string | null
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  status?: 'pending' | 'approved' | 'rejected'
}

export async function upsertCityPlace(
  input: UpsertCityPlaceInput,
): Promise<ActionResult<{ id: string }>> {
  await requirePlatformAdmin()
  if (!input.cityId) return { ok: false, error: 'city_required' }
  const name = (input.name ?? '').trim()
  if (!name) return { ok: false, error: 'name_required' }
  const status = input.status ?? 'approved'
  if (!PLACE_STATUSES.has(status)) return { ok: false, error: 'invalid_status' }

  const client = await getServerClient()
  const payload = {
    city_id: input.cityId,
    name,
    description: (input.description ?? '').trim() || null,
    cf_image_id: input.cfImageId ?? null,
    category: input.category?.trim() || null,
    latitude: typeof input.latitude === 'number' ? input.latitude : null,
    longitude: typeof input.longitude === 'number' ? input.longitude : null,
    address: input.address?.trim() || null,
    status,
  }

  if (input.placeId) {
    const { data, error } = await client
      .from('city_places')
      .update(payload)
      .eq('id', input.placeId)
      .select('id, city_id')
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!data) return { ok: false, error: 'not_found' }
    const row = data as { id: string; city_id: string }
    await revalidateAfterPlaceChange(client, row.city_id)
    return { ok: true, data: { id: row.id } }
  }

  const { data, error } = await client
    .from('city_places')
    .insert(payload)
    .select('id, city_id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }
  const row = data as { id: string; city_id: string }
  await revalidateAfterPlaceChange(client, row.city_id)
  return { ok: true, data: { id: row.id } }
}

export async function deleteCityPlace(input: {
  placeId: string
}): Promise<ActionResult<{ id: string }>> {
  await requirePlatformAdmin()
  if (!input.placeId) return { ok: false, error: 'missing_input' }
  const client = await getServerClient()
  const { data: existing } = await client
    .from('city_places')
    .select('id, city_id')
    .eq('id', input.placeId)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }
  const { error } = await client.from('city_places').delete().eq('id', input.placeId)
  if (error) return { ok: false, error: error.message }
  await revalidateAfterPlaceChange(client, (existing as { city_id: string }).city_id)
  return { ok: true, data: { id: input.placeId } }
}

async function revalidateAfterPlaceChange(
  client: Awaited<ReturnType<typeof getServerClient>>,
  cityId: string,
) {
  const { data: city } = await client
    .from('cities')
    .select('slug')
    .eq('id', cityId)
    .maybeSingle()
  if (city) {
    const slug = (city as { slug: string }).slug
    revalidatePath(`/admin/ciudades/${slug}`)
    revalidatePath(`/cities/${slug}/places`)
    revalidatePath(`/cities/${slug}`)
  }
}

// ---------- City media (photos / videos / publications) ----------

async function revalidateCitySection(client: Awaited<ReturnType<typeof getServerClient>>, cityId: string, sections: string[]) {
  const { data: city } = await client.from('cities').select('slug').eq('id', cityId).maybeSingle()
  if (!city) return
  const slug = (city as { slug: string }).slug
  revalidatePath(`/admin/ciudades/${slug}`)
  revalidatePath(`/cities/${slug}`)
  for (const s of sections) revalidatePath(`/cities/${slug}/${s}`)
}

export async function addCityPhoto(input: {
  cityId: string
  cfImageId: string
  caption?: string | null
}): Promise<ActionResult<{ id: string }>> {
  await requirePlatformAdmin()
  if (!input.cityId || !input.cfImageId) return { ok: false, error: 'missing_input' }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  const { data, error } = await client
    .from('city_photos')
    .insert({
      city_id: input.cityId,
      cf_image_id: input.cfImageId,
      caption: input.caption?.trim() || null,
      uploader_id: auth?.user?.id ?? null,
    })
    .select('id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }
  await revalidateCitySection(client, input.cityId, ['photos'])
  return { ok: true, data: { id: (data as { id: string }).id } }
}

export async function deleteCityPhoto(input: { photoId: string }): Promise<ActionResult<{ id: string }>> {
  await requirePlatformAdmin()
  const client = await getServerClient()
  const { data: existing } = await client
    .from('city_photos')
    .select('id, city_id')
    .eq('id', input.photoId)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }
  const { error } = await client.from('city_photos').delete().eq('id', input.photoId)
  if (error) return { ok: false, error: error.message }
  await revalidateCitySection(client, (existing as { city_id: string }).city_id, ['photos'])
  return { ok: true, data: { id: input.photoId } }
}

export async function addCityVideo(input: {
  cityId: string
  cfVideoUid: string
  cfThumbnailId?: string | null
  caption?: string | null
}): Promise<ActionResult<{ id: string }>> {
  await requirePlatformAdmin()
  if (!input.cityId || !input.cfVideoUid) return { ok: false, error: 'missing_input' }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  const { data, error } = await client
    .from('city_videos')
    .insert({
      city_id: input.cityId,
      cf_video_uid: input.cfVideoUid,
      cf_thumbnail_id: input.cfThumbnailId ?? null,
      caption: input.caption?.trim() || null,
      uploader_id: auth?.user?.id ?? null,
    })
    .select('id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }
  await revalidateCitySection(client, input.cityId, ['videos'])
  return { ok: true, data: { id: (data as { id: string }).id } }
}

export async function deleteCityVideo(input: { videoId: string }): Promise<ActionResult<{ id: string }>> {
  await requirePlatformAdmin()
  const client = await getServerClient()
  const { data: existing } = await client
    .from('city_videos')
    .select('id, city_id')
    .eq('id', input.videoId)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }
  const { error } = await client.from('city_videos').delete().eq('id', input.videoId)
  if (error) return { ok: false, error: error.message }
  await revalidateCitySection(client, (existing as { city_id: string }).city_id, ['videos'])
  return { ok: true, data: { id: input.videoId } }
}

export async function createCityPublication(input: {
  cityId: string
  body: string
  isPinned?: boolean
}): Promise<ActionResult<{ id: string }>> {
  await requirePlatformAdmin()
  if (!input.cityId) return { ok: false, error: 'city_required' }
  const body = (input.body ?? '').trim()
  if (!body) return { ok: false, error: 'body_required' }
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  const { data, error } = await client
    .from('city_publications')
    .insert({
      city_id: input.cityId,
      author_id: auth?.user?.id ?? null,
      body,
      cf_media: [],
      is_pinned: Boolean(input.isPinned),
    })
    .select('id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }
  await revalidateCitySection(client, input.cityId, ['publications'])
  return { ok: true, data: { id: (data as { id: string }).id } }
}

export async function deleteCityPublication(input: {
  publicationId: string
}): Promise<ActionResult<{ id: string }>> {
  await requirePlatformAdmin()
  const client = await getServerClient()
  const { data: existing } = await client
    .from('city_publications')
    .select('id, city_id')
    .eq('id', input.publicationId)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }
  const { error } = await client.from('city_publications').delete().eq('id', input.publicationId)
  if (error) return { ok: false, error: error.message }
  await revalidateCitySection(client, (existing as { city_id: string }).city_id, ['publications'])
  return { ok: true, data: { id: input.publicationId } }
}

export async function togglePublicationPinned(input: {
  publicationId: string
  isPinned: boolean
}): Promise<ActionResult<{ id: string; isPinned: boolean }>> {
  await requirePlatformAdmin()
  const client = await getServerClient()
  const { data, error } = await client
    .from('city_publications')
    .update({ is_pinned: input.isPinned })
    .eq('id', input.publicationId)
    .select('id, city_id, is_pinned')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }
  const row = data as { id: string; city_id: string; is_pinned: boolean }
  await revalidateCitySection(client, row.city_id, ['publications'])
  return { ok: true, data: { id: row.id, isPinned: row.is_pinned } }
}

// ---------- City promotions (admin CRUD + moderation) ----------

type PromotionDuration = '1d' | '2d' | '3d' | '1w' | '2w' | '1m'
const PROMOTION_DURATIONS = new Set<PromotionDuration>(['1d', '2d', '3d', '1w', '2w', '1m'])
const PROMOTION_STATUSES = new Set(['active', 'expired', 'removed'])

const DURATION_MS: Record<PromotionDuration, number> = {
  '1d': 1 * 24 * 60 * 60 * 1000,
  '2d': 2 * 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '2w': 14 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
}

export async function createCityPromotion(input: {
  cityId: string
  title: string
  body?: string | null
  duration: PromotionDuration
  coverCfImageId?: string | null
}): Promise<ActionResult<{ id: string }>> {
  await requirePlatformAdmin()
  if (!input.cityId) return { ok: false, error: 'city_required' }
  const title = (input.title ?? '').trim()
  if (!title) return { ok: false, error: 'title_required' }
  if (!PROMOTION_DURATIONS.has(input.duration)) return { ok: false, error: 'invalid_duration' }

  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  const startsAt = new Date()
  const expiresAt = new Date(startsAt.getTime() + DURATION_MS[input.duration])

  const { data, error } = await client
    .from('city_promotions')
    .insert({
      city_id: input.cityId,
      author_id: auth?.user?.id ?? null,
      title,
      body: (input.body ?? '').trim() || null,
      cover_cf_image_id: input.coverCfImageId ?? null,
      duration: input.duration,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'active',
    })
    .select('id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'insert_returned_no_row' }
  await revalidateCitySection(client, input.cityId, ['promotions'])
  return { ok: true, data: { id: (data as { id: string }).id } }
}

export async function setCityPromotionStatus(input: {
  promotionId: string
  status: 'active' | 'expired' | 'removed'
}): Promise<ActionResult<{ id: string; status: string }>> {
  await requirePlatformAdmin()
  if (!PROMOTION_STATUSES.has(input.status)) return { ok: false, error: 'invalid_status' }
  const client = await getServerClient()
  const { data, error } = await client
    .from('city_promotions')
    .update({ status: input.status })
    .eq('id', input.promotionId)
    .select('id, status, city_id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }
  const row = data as { id: string; status: string; city_id: string }
  await revalidateCitySection(client, row.city_id, ['promotions'])
  return { ok: true, data: { id: row.id, status: row.status } }
}

export async function deleteCityPromotion(input: {
  promotionId: string
}): Promise<ActionResult<{ id: string }>> {
  await requirePlatformAdmin()
  const client = await getServerClient()
  const { data: existing } = await client
    .from('city_promotions')
    .select('id, city_id')
    .eq('id', input.promotionId)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }
  const { error } = await client.from('city_promotions').delete().eq('id', input.promotionId)
  if (error) return { ok: false, error: error.message }
  await revalidateCitySection(client, (existing as { city_id: string }).city_id, ['promotions'])
  return { ok: true, data: { id: input.promotionId } }
}

// ---------- City complaints (admin) ----------

const COMPLAINT_STATUSES = new Set(['new', 'seen', 'resolved', 'rejected'])

export async function setCityComplaintStatus(input: {
  complaintId: string
  status: 'new' | 'seen' | 'resolved' | 'rejected'
}): Promise<ActionResult<{ id: string; status: string }>> {
  await requirePlatformAdmin()
  if (!COMPLAINT_STATUSES.has(input.status)) return { ok: false, error: 'invalid_status' }
  const client = await getServerClient()
  const { data, error } = await client
    .from('city_complaints')
    .update({ status: input.status })
    .eq('id', input.complaintId)
    .select('id, status, city_id')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }
  const row = data as { id: string; status: string; city_id: string }
  await revalidateCitySection(client, row.city_id, ['complaints'])
  return { ok: true, data: { id: row.id, status: row.status } }
}

export async function deleteCityComplaint(input: {
  complaintId: string
}): Promise<ActionResult<{ id: string }>> {
  await requirePlatformAdmin()
  const client = await getServerClient()
  const { data: existing } = await client
    .from('city_complaints')
    .select('id, city_id')
    .eq('id', input.complaintId)
    .maybeSingle()
  if (!existing) return { ok: false, error: 'not_found' }
  const { error } = await client.from('city_complaints').delete().eq('id', input.complaintId)
  if (error) return { ok: false, error: error.message }
  await revalidateCitySection(client, (existing as { city_id: string }).city_id, ['complaints'])
  return { ok: true, data: { id: input.complaintId } }
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
