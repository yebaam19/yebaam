'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import type { MediaAsset } from '../types'
import { assertSchoolAdmin } from '../server/school.server'

export async function saveSchoolImage(
  schoolId: string,
  cfImageId: string,
  opts?: { programId?: string; instructorId?: string }
) {
  await assertSchoolAdmin(schoolId)
  const client = await getServerClient()
  const { data, error } = await client.rpc('escuelas_save_image', {
    p_school_id:     schoolId,
    p_cf_image_id:   cfImageId,
    p_program_id:    opts?.programId ?? null,
    p_instructor_id: opts?.instructorId ?? null,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/escuelas/admin/${schoolId}/media`)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as MediaAsset
}

export async function saveSchoolVideo(schoolId: string, cfVideoUid: string) {
  await assertSchoolAdmin(schoolId)
  const client = await getServerClient()
  const { data, error } = await client.rpc('escuelas_save_video', {
    p_school_id:    schoolId,
    p_cf_video_uid: cfVideoUid,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/escuelas/admin/${schoolId}/media`)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as MediaAsset
}

export async function setPrimaryMedia(mediaId: string, schoolId: string) {
  await assertSchoolAdmin(schoolId)
  const client = await getServerClient()
  const { error } = await client.rpc('escuelas_set_primary_media', {
    p_media_id:  mediaId,
    p_school_id: schoolId,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/escuelas/admin/${schoolId}/media`)
  revalidatePath('/escuelas/[slug]', 'page')
}

// schoolId is now required: ownership is verified before the delete, and the
// RPC enforces school_id = p_school_id in the WHERE clause to prevent cross-tenant deletes.
export async function deleteMedia(mediaId: string, schoolId: string) {
  await assertSchoolAdmin(schoolId)
  const client = await getServerClient()
  const { error } = await client.rpc('escuelas_delete_media', {
    p_media_id:  mediaId,
    p_school_id: schoolId,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/escuelas/admin/${schoolId}/media`)
  revalidatePath('/escuelas/[slug]', 'page')
}
