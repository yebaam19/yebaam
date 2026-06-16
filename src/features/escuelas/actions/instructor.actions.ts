'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { Instructor } from '../types'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { client }
}

const InstructorSchema = z.object({
  school_id:   z.string().min(1),
  name:        z.string().min(2).max(150),
  specialties: z.string().min(2).max(300),
  bio:         z.string().min(10).max(2000),
  instagram:   z.string().max(100).optional(),
  cf_image_id: z.string().optional(),
})

export async function createInstructor(formData: FormData) {
  const { client } = await requireSession()
  const parsed = InstructorSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('escuelas_create_instructor', { p_data: parsed.data })
  if (error) throw new Error(error.message)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as Instructor
}

export async function updateInstructor(instructorId: string, formData: FormData) {
  const { client } = await requireSession()
  const parsed = InstructorSchema.partial().omit({ school_id: true }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('escuelas_update_instructor', {
    p_id:   instructorId,
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as Instructor
}
