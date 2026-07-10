'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { MediaAsset } from '../types'
import { isUserBusinessAdmin } from '../server/business.server'
import { revalidateBusinessAdmin } from '../lib/revalidate-admin'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { userId: data.user.id, client }
}

async function requireBusinessAdmin(businessId: string) {
  if (!(await isUserBusinessAdmin(businessId))) {
    throw new Error('No tienes permisos para administrar este negocio')
  }
}

const ImageAssetSchema = z.object({
  business_id: z.string().uuid(),
  cf_image_id: z.string().min(1),
  product_id:  z.string().uuid().optional(),
  alt_text:    z.string().max(200).optional(),
})

const VideoAssetSchema = z.object({
  business_id:  z.string().uuid(),
  cf_video_uid: z.string().min(1),
})

export async function saveBusinessImage(input: z.infer<typeof ImageAssetSchema>) {
  const { client } = await requireSession()
  const parsed = ImageAssetSchema.parse(input)
  await requireBusinessAdmin(parsed.business_id)

  const { data, error } = await client.rpc('comidas_save_business_image', {
    p_business_id: parsed.business_id,
    p_cf_image_id: parsed.cf_image_id,
    p_product_id:  parsed.product_id ?? null,
    p_alt_text:    parsed.alt_text ?? null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/negocios/[slug]/galeria', 'page')
  revalidateBusinessAdmin(parsed.business_id, 'media')
  return data as MediaAsset
}

export async function saveBusinessVideo(input: z.infer<typeof VideoAssetSchema>) {
  const { client } = await requireSession()
  const parsed = VideoAssetSchema.parse(input)
  await requireBusinessAdmin(parsed.business_id)

  const { data, error } = await client.rpc('comidas_save_business_video', {
    p_business_id: parsed.business_id,
    p_cf_video_uid: parsed.cf_video_uid,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/negocios/[slug]/galeria', 'page')
  revalidateBusinessAdmin(parsed.business_id, 'media')
  return data as MediaAsset
}

export async function setPrimaryMedia(mediaId: string, businessId: string) {
  const { client } = await requireSession()
  await requireBusinessAdmin(businessId)

  const { error } = await client.rpc('comidas_set_primary_media', {
    p_media_id:    mediaId,
    p_business_id: businessId,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/negocios/[slug]', 'page')
  revalidateBusinessAdmin(businessId, 'media')
}

export async function deleteMedia(mediaId: string) {
  const { client } = await requireSession()

  // Lookup the asset's business_id server-side — never trust client for ownership
  // scope. comidas isn't exposed via PostgREST, so go through an RPC instead of
  // a direct schema-scoped REST query (which fails with PGRST106).
  const { data: ownerBusinessId, error: lookupError } = await client.rpc('get_media_business_id', {
    p_media_id: mediaId,
  })
  if (lookupError) throw new Error(`Error al buscar el archivo: ${lookupError.message} (code: ${lookupError.code})`)
  if (!ownerBusinessId) throw new Error('Archivo no encontrado')
  const businessId = ownerBusinessId as string
  await requireBusinessAdmin(businessId)

  const { error } = await client.rpc('comidas_delete_media', { p_media_id: mediaId })
  if (error) throw new Error(error.message)
  revalidatePath('/negocios/[slug]/galeria', 'page')
  revalidateBusinessAdmin(businessId, 'media')
}
