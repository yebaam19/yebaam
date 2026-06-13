'use server'

import {
  type ActionResult,
  requireAdmin,
  requireAdminWithUser,
  deleteCityRow,
  insertCityRow,
  revalidateCityById,
} from './_shared'

/** Admin-only CRUD for a city's media wall: photos, videos, and text
 *  publications. Each mutation revalidates the matching `/cities/<slug>/<section>`
 *  sub-page. */

export async function addCityPhoto(input: {
  cityId: string
  cfImageId: string
  caption?: string | null
}): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!input.cityId || !input.cfImageId) return { ok: false, error: 'missing_input' }
  return insertCityRow({
    client,
    table: 'city_photos',
    payload: {
      city_id: input.cityId,
      cf_image_id: input.cfImageId,
      caption: input.caption?.trim() || null,
      uploader_id: userId,
    },
    cityId: input.cityId,
    section: 'photos',
  })
}

export async function deleteCityPhoto(input: {
  photoId: string
}): Promise<ActionResult<{ id: string }>> {
  return deleteCityRow({ table: 'city_photos', id: input.photoId, section: 'photos' })
}

export async function addCityVideo(input: {
  cityId: string
  cfVideoUid: string
  cfThumbnailId?: string | null
  caption?: string | null
}): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!input.cityId || !input.cfVideoUid) return { ok: false, error: 'missing_input' }
  return insertCityRow({
    client,
    table: 'city_videos',
    payload: {
      city_id: input.cityId,
      cf_video_uid: input.cfVideoUid,
      cf_thumbnail_id: input.cfThumbnailId ?? null,
      caption: input.caption?.trim() || null,
      uploader_id: userId,
    },
    cityId: input.cityId,
    section: 'videos',
  })
}

export async function deleteCityVideo(input: {
  videoId: string
}): Promise<ActionResult<{ id: string }>> {
  return deleteCityRow({ table: 'city_videos', id: input.videoId, section: 'videos' })
}

export async function createCityPublication(input: {
  cityId: string
  body: string
  isPinned?: boolean
}): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!input.cityId) return { ok: false, error: 'city_required' }
  const body = (input.body ?? '').trim()
  if (!body) return { ok: false, error: 'body_required' }
  return insertCityRow({
    client,
    table: 'city_publications',
    payload: {
      city_id: input.cityId,
      author_id: userId,
      body,
      cf_media: [],
      is_pinned: Boolean(input.isPinned),
    },
    cityId: input.cityId,
    section: 'publications',
  })
}

export async function deleteCityPublication(input: {
  publicationId: string
}): Promise<ActionResult<{ id: string }>> {
  return deleteCityRow({
    table: 'city_publications',
    id: input.publicationId,
    section: 'publications',
  })
}

export async function togglePublicationPinned(input: {
  publicationId: string
  isPinned: boolean
}): Promise<ActionResult<{ id: string; isPinned: boolean }>> {
  const { client } = await requireAdmin()
  const { data, error } = await client
    .from('city_publications')
    .update({ is_pinned: input.isPinned })
    .eq('id', input.publicationId)
    .select('id, city_id, is_pinned')
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found' }

  const row = data as { id: string; city_id: string; is_pinned: boolean }
  await revalidateCityById(client, row.city_id, ['publications'])
  return { ok: true, data: { id: row.id, isPinned: row.is_pinned } }
}
