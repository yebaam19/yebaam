'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { Program } from '../types'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { client }
}

const ProgramSchema = z.object({
  school_id:              z.string().min(1),
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
  const { client } = await requireSession()
  const parsed = ProgramSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('escuelas_create_program', { p_data: parsed.data })
  if (error) throw new Error(error.message)
  revalidatePath('/programas')
  revalidatePath('/escuelas/[slug]', 'page')
  return data as Program
}

export async function updateProgram(programId: string, formData: FormData) {
  const { client } = await requireSession()
  const parsed = ProgramSchema.partial().safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('escuelas_update_program', {
    p_id:   programId,
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/programas')
  return data as Program
}

export async function deactivateProgram(programId: string) {
  const { client } = await requireSession()
  const { error } = await client.rpc('escuelas_deactivate_program', { p_id: programId })
  if (error) throw new Error(error.message)
  revalidatePath('/programas')
}
