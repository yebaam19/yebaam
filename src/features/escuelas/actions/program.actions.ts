'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { Program } from '../types'
import { assertSchoolAdmin } from '../server/school.server'

const ProgramSchema = z.object({
  school_id:              z.string().uuid(),
  discipline_id:          z.string().min(1),
  campus_id:              z.string().min(1).optional(),
  instructor_id:          z.string().min(1).optional(),
  name:                   z.string().min(2).max(150),
  slug:                   z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  short_description:      z.string().min(10).max(300),
  description:            z.string().min(10),
  modality:               z.enum(['PRESENTIAL', 'VIRTUAL', 'HYBRID']),
  level:                  z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL']),
  program_type:           z.enum(['COURSE', 'WORKSHOP', 'CLASS', 'INTENSIVE', 'DIPLOMA']).optional(),
  age_range:              z.string().min(1).max(50),
  duration:               z.string().min(1).max(100),
  schedule_summary:       z.string().min(1).max(300),
  monthly_price:          z.coerce.number().nonnegative(),
  registration_fee:       z.coerce.number().nonnegative().optional(),
  currency:               z.string().max(3).optional(),
  cf_image_id:            z.string().optional(),
  enrollment_open:        z.coerce.boolean().optional(),
  trial_class_available:  z.coerce.boolean().optional(),
  materials_included:     z.coerce.boolean().optional(),
})

export async function createProgram(formData: FormData) {
  const parsed = ProgramSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)
  await assertSchoolAdmin(parsed.data.school_id)
  const client = await getServerClient()
  const { data, error } = await client.rpc('escuelas_create_program', { p_data: parsed.data })
  if (error) throw new Error(error.message)
  revalidatePath(`/escuelas/admin/${parsed.data.school_id}/programas`)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as Program
}

export async function updateProgram(schoolId: string, programId: string, formData: FormData) {
  await assertSchoolAdmin(schoolId)
  const parsed = ProgramSchema.partial().omit({ school_id: true }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)
  const client = await getServerClient()
  const { data, error } = await client.rpc('escuelas_update_program', {
    p_id:   programId,
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/escuelas/admin/${schoolId}/programas`)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as Program
}

export async function deactivateProgram(programId: string, schoolId: string) {
  await assertSchoolAdmin(schoolId)
  const client = await getServerClient()
  const { error } = await client.rpc('escuelas_deactivate_program', { p_id: programId })
  if (error) throw new Error(error.message)
  revalidatePath(`/escuelas/admin/${schoolId}/programas`)
  revalidatePath('/escuelas/[slug]', 'page')
}
