'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import type { MediaAsset } from '../types'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { client }
}

export async function saveSchoolImage(
  schoolId: string,
  cfImageId: string,
  opts?: { programId?: string; instructorId?: string }
) {
  const { client } = await requireSession()
  const { data, error } = await client.rpc('escuelas_save_image', {
    p_school_id:     schoolId,
    p_cf_image_id:   cfImageId,
    p_program_id:    opts?.programId ?? null,
    p_instructor_id: opts?.instructorId ?? null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as MediaAsset
}

export async function saveSchoolVideo(schoolId: string, cfVideoUid: string) {
  const { client } = await requireSession()
  const { data, error } = await client.rpc('escuelas_save_video', {
    p_school_id:    schoolId,
    p_cf_video_uid: cfVideoUid,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as MediaAsset
}

export async function setPrimaryMedia(mediaId: string, schoolId: string) {
  const { client } = await requireSession()
  const { error } = await client.rpc('escuelas_set_primary_media', {
    p_media_id:  mediaId,
    p_school_id: schoolId,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/escuelas/[slug]', 'page')
}

export async function deleteMedia(mediaId: string) {
  const { client } = await requireSession()
  const { error } = await client.rpc('escuelas_delete_media', { p_media_id: mediaId })
  if (error) throw new Error(error.message)
  revalidatePath('/escuelas/[slug]', 'page')
}
