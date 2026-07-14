'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import type { School } from '../types'
import { assertSchoolAdmin } from '../server/school.server'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { userId: data.user.id, client }
}

// Alias para consistencia con otros action files; assertSchoolAdmin incluye
// el fallback a created_by además del check en school_admins.
const requireSchoolAdmin = assertSchoolAdmin

const SchoolSchema = z.object({
  name:                  z.string().min(2).max(150),
  slug:                  z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  category:              z.enum(['MUSIC', 'ARTS', 'DANCE', 'THEATER', 'MULTIDISCIPLINARY']),
  school_type:           z.enum(['PRIVATE', 'PUBLIC', 'NON_PROFIT', 'COLLEGE']),
  description:           z.string().min(10),
  about_article:         z.string().optional(),
  city:                  z.string().min(1).max(100),
  address:               z.string().min(1).max(200),
  phone:                 z.string().min(5).max(30),
  whatsapp:              z.string().min(5).max(30),
  email:                 z.string().email(),
  website:               z.string().url().optional().or(z.literal('')),
  instagram:             z.string().optional(),
  facebook:              z.string().optional(),
  tiktok:                z.string().optional(),
  youtube:               z.string().optional(),
  profile_cf_image_id:   z.string().optional(),
  cover_cf_image_id:     z.string().optional(),
  primary_cta_label:     z.string().max(60).optional(),
  secondary_cta_label:   z.string().max(60).optional(),
  lead_form_title:       z.string().max(120).optional(),
  lead_form_description: z.string().optional(),
  trial_class_message:   z.string().optional(),
  general_schedule:      z.string().optional(),
})

export async function createSchool(formData: FormData) {
  const { client } = await requireSession()
  const parsed = SchoolSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  // p_created_by eliminado — el RPC deriva auth.uid() internamente
  const { data, error } = await client.rpc('escuelas_create_school', {
    p_data: parsed.data,
  })
  if (error) {
    Sentry.captureException(error, { tags: { action: 'createSchool' } })
    throw new Error(error.message)
  }
  revalidatePath('/escuelas')
  return data as School
}

export async function updateSchool(schoolId: string, formData: FormData) {
  await requireSchoolAdmin(schoolId)
  const client = await getServerClient()

  const parsed = SchoolSchema.partial().safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('escuelas_update_school', {
    p_id:   schoolId,
    p_data: parsed.data,
  })
  if (error) {
    Sentry.captureException(error, { tags: { action: 'updateSchool', schoolId } })
    throw new Error(error.message)
  }
  revalidatePath('/escuelas/[slug]', 'page')
  revalidatePath(`/escuelas/admin/${schoolId}`)
  revalidatePath(`/escuelas/admin/${schoolId}/settings`)
  return data as School
}

export async function toggleSchoolStatus(schoolId: string, isActive: boolean) {
  await requireSchoolAdmin(schoolId)
  const client = await getServerClient()

  const { error } = await client.rpc('escuelas_toggle_school_status', {
    p_id:        schoolId,
    p_is_active: isActive,
  })
  if (error) {
    Sentry.captureException(error, { tags: { action: 'toggleSchoolStatus', schoolId } })
    throw new Error(error.message)
  }
  revalidatePath('/escuelas')
}

export async function updateSchoolImage(
  schoolId: string,
  field: 'profile_cf_image_id' | 'cover_cf_image_id',
  cfImageId: string,
) {
  await requireSchoolAdmin(schoolId)
  const client = await getServerClient()
  const { data, error } = await client.rpc('escuelas_update_school', {
    p_id:   schoolId,
    p_data: { [field]: cfImageId },
  })
  if (error) {
    Sentry.captureException(error, { tags: { action: 'updateSchoolImage', schoolId, field } })
    throw new Error(error.message)
  }
  revalidatePath('/escuelas/[slug]', 'page')
  revalidatePath(`/escuelas/admin/${schoolId}`)
  revalidatePath(`/escuelas/admin/${schoolId}/settings`)
  return data as School
}

export async function toggleSchoolFollow(schoolId: string) {
  const { client } = await requireSession()
  // p_user_id eliminado — el RPC (20260708000000) deriva auth.uid() internamente
  const { error } = await client.rpc('escuelas_toggle_school_follow', {
    p_school_id: schoolId,
  })
  if (error) {
    Sentry.captureException(error, { tags: { action: 'toggleSchoolFollow', schoolId } })
    throw new Error(error.message)
  }
  revalidatePath('/escuelas/[slug]', 'page')
}
