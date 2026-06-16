'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient, getServiceClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { MediaAsset } from '../types'
import { isUserBusinessAdmin } from '../server/business.server'

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
}

export async function deleteMedia(mediaId: string) {
  const { client } = await requireSession()

  // Lookup the asset's business_id server-side — never trust client for ownership scope
  const sc = getServiceClient()
  const { data: asset } = await sc
    .schema('comidas')
    .from('media_assets')
    .select('business_id')
    .eq('id', mediaId)
    .maybeSingle()
  if (!asset) throw new Error('Archivo no encontrado')
  await requireBusinessAdmin(asset.business_id as string)

  const { error } = await client.rpc('comidas_delete_media', { p_media_id: mediaId })
  if (error) throw new Error(error.message)
  revalidatePath('/negocios/[slug]/galeria', 'page')
}
