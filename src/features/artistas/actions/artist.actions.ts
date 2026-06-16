'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { ArtistProfile } from '../types'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { userId: data.user.id, client }
}

const ProfileSchema = z.object({
  slug:                z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  stage_name:          z.string().min(2).max(100),
  legal_name:          z.string().max(120).optional(),
  artist_type:         z.enum([
    'MUSICIAN','SINGER','DANCER','ACTOR','MODEL',
    'VISUAL_ARTIST','PHOTOGRAPHER','FILMMAKER','WRITER',
    'PRODUCER','DJ','COMEDIAN','PERFORMER','MAKEUP_ARTIST',
    'FASHION_DESIGNER','MULTIDISCIPLINARY','OTHER',
  ]),
  biography:           z.string().optional(),
  short_bio:           z.string().max(300).optional(),
  city:                z.string().min(1).max(100),
  country:             z.string().max(80).optional(),
  availability:        z.string().optional(),
  website:             z.string().optional(),
  profile_cf_image_id: z.string().optional(),
  cover_cf_image_id:   z.string().optional(),
  category_id:         z.string().uuid().optional(),
  seo_title:           z.string().max(80).optional(),
  seo_description:     z.string().max(200).optional(),
})

export async function createArtistProfile(formData: FormData) {
  const { userId, client } = await requireSession()
  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('artistas_create_profile', {
    p_owner_id: userId,
    p_data:     parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas')
  return data as ArtistProfile
}

export async function updateArtistProfile(profileId: string, formData: FormData) {
  const { client } = await requireSession()
  const parsed = ProfileSchema.partial().safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('artistas_update_profile', {
    p_id:   profileId,
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]', 'page')
  return data as ArtistProfile
}

export async function updateArtistProfileStatus(
  profileId: string,
  status: 'DRAFT' | 'PUBLISHED' | 'SUSPENDED' | 'ARCHIVED'
) {
  const { client } = await requireSession()
  const { error } = await client.rpc('artistas_update_profile_status', {
    p_id:     profileId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas')
}

export async function toggleFollow(artistProfileId: string) {
  const { userId, client } = await requireSession()
  const { error } = await client.rpc('artistas_toggle_follow', {
    p_user_id:          userId,
    p_artist_profile_id: artistProfileId,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]', 'page')
}

export async function toggleFavorite(artistProfileId: string) {
  const { userId, client } = await requireSession()
  const { error } = await client.rpc('artistas_toggle_favorite', {
    p_user_id:          userId,
    p_artist_profile_id: artistProfileId,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]', 'page')
}
