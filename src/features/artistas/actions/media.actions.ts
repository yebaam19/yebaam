'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import type { MediaAsset } from '../types'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { userId: data.user.id, client }
}

export async function saveArtistImage(artistProfileId: string, cfImageId: string, portfolioItemId?: string) {
  const { userId, client } = await requireSession()
  const { data, error } = await client.rpc('artistas_save_image', {
    p_uploader_id:       userId,
    p_artist_profile_id: artistProfileId,
    p_cf_image_id:       cfImageId,
    p_portfolio_item_id: portfolioItemId ?? null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]', 'page')
  return data as MediaAsset
}

export async function saveArtistVideo(artistProfileId: string, cfVideoUid: string, portfolioItemId?: string) {
  const { userId, client } = await requireSession()
  const { data, error } = await client.rpc('artistas_save_video', {
    p_uploader_id:       userId,
    p_artist_profile_id: artistProfileId,
    p_cf_video_uid:      cfVideoUid,
    p_portfolio_item_id: portfolioItemId ?? null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]', 'page')
  return data as MediaAsset
}

export async function saveArtistAudio(artistProfileId: string, cfAudioKey: string, portfolioItemId?: string) {
  const { userId, client } = await requireSession()
  const { data, error } = await client.rpc('artistas_save_audio', {
    p_uploader_id:       userId,
    p_artist_profile_id: artistProfileId,
    p_cf_audio_key:      cfAudioKey,
    p_portfolio_item_id: portfolioItemId ?? null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]', 'page')
  return data as MediaAsset
}

export async function deleteArtistMedia(mediaId: string) {
  const { client } = await requireSession()
  const { error } = await client.rpc('artistas_delete_media', { p_media_id: mediaId })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]', 'page')
}
