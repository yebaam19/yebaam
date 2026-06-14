'use server'

import { extractCfImageId, extractStreamUid } from '../service-action.helpers'
import type { AddServiceMediaInput } from '../service-action.helpers'
import { requireSession, revalidateService } from '../service-action.session'

export async function addServiceMediaAction(
  serviceId: string,
  input: AddServiceMediaInput,
): Promise<{ id: string; type: 'image' | 'video'; url: string; caption?: string; order: number }> {
  const { client } = await requireSession()
  const isVideo = input.type === 'video'
  const cfImageId = isVideo ? null : extractCfImageId(input.url)
  const cfStreamUid = isVideo ? extractStreamUid(input.url) : null
  if (isVideo ? !cfStreamUid : !cfImageId) {
    throw new Error('No se pudo determinar el identificador de Cloudflare del archivo.')
  }

  const { data, error } = await client
    .from('professional_service_media')
    .insert({
      service_id: serviceId,
      type: isVideo ? 'VIDEO' : 'IMAGE',
      cf_image_id: cfImageId,
      cf_stream_uid: cfStreamUid,
      caption: input.caption ?? null,
      position: input.order ?? 0,
    })
    .select('id, type, position, caption')
    .maybeSingle()
  if (error || !data) throw new Error(error?.message ?? 'No se pudo agregar el archivo.')

  const row = data as { id: string; type: string; position: number; caption: string | null }
  revalidateService()
  return {
    id: row.id,
    type: isVideo ? 'video' : 'image',
    url: input.url,
    caption: row.caption ?? undefined,
    order: row.position,
  }
}

export async function removeServiceMediaAction(serviceId: string, mediaId: string): Promise<{ ok: true }> {
  const { client } = await requireSession()
  const { error } = await client
    .from('professional_service_media')
    .delete()
    .eq('id', mediaId)
    .eq('service_id', serviceId)
  if (error) throw new Error(error.message)
  revalidateService()
  return { ok: true }
}

export async function reorderServiceMediaAction(
  serviceId: string,
  order: Array<{ mediaId: string; order: number }>,
): Promise<{ ok: true }> {
  const { client } = await requireSession()
  for (const { mediaId, order: position } of order) {
    const { error } = await client
      .from('professional_service_media')
      .update({ position })
      .eq('id', mediaId)
      .eq('service_id', serviceId)
    if (error) throw new Error(error.message)
  }
  revalidateService()
  return { ok: true }
}

export async function updateServiceMediaAction(
  serviceId: string,
  mediaId: string,
  updates: { caption?: string; order?: number },
): Promise<{ ok: true }> {
  const { client } = await requireSession()
  const patch: Record<string, unknown> = {}
  if (updates.caption !== undefined) patch.caption = updates.caption || null
  if (updates.order !== undefined) patch.position = updates.order
  if (Object.keys(patch).length > 0) {
    const { error } = await client
      .from('professional_service_media')
      .update(patch)
      .eq('id', mediaId)
      .eq('service_id', serviceId)
    if (error) throw new Error(error.message)
  }
  revalidateService()
  return { ok: true }
}
