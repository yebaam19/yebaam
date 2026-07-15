'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { Instructor } from '../types'
import { assertSchoolAdmin } from '../server/school.server'

const InstructorSchema = z.object({
  school_id:          z.string().uuid(),
  name:               z.string().min(2).max(150),
  specialties:        z.string().min(2).max(300),
  bio:                z.string().min(10).max(2000),
  instagram:          z.string().max(100).optional(),
  photo_cf_image_id:  z.string().optional(),
})

export async function createInstructor(formData: FormData) {
  const parsed = InstructorSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)
  await assertSchoolAdmin(parsed.data.school_id)
  const client = await getServerClient()
  const { data, error } = await client.rpc('escuelas_create_instructor', { p_data: parsed.data })
  if (error) throw new Error(error.message)
  revalidatePath(`/escuelas/admin/${parsed.data.school_id}/instructores`)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as Instructor
}

// TODO: sin call site activo — ver auditoría QA (falta UI de edición de instructores)
export async function updateInstructor(schoolId: string, instructorId: string, formData: FormData) {
  await assertSchoolAdmin(schoolId)
  const parsed = InstructorSchema.partial().omit({ school_id: true }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)
  const client = await getServerClient()
  const { data, error } = await client.rpc('escuelas_update_instructor', {
    p_id:   instructorId,
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/escuelas/admin/${schoolId}/instructores`)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as Instructor
}
