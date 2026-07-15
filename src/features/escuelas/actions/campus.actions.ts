'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { Campus } from '../types'
import { assertSchoolAdmin } from '../server/school.server'

const CampusSchema = z.object({
  school_id: z.string().uuid(),
  name:      z.string().min(2).max(150),
  city:      z.string().min(2).max(100),
  address:   z.string().min(5).max(300),
  phone:     z.string().min(7).max(30),
})

export async function createCampus(formData: FormData) {
  const parsed = CampusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)
  await assertSchoolAdmin(parsed.data.school_id)
  const client = await getServerClient()
  const { data, error } = await client.rpc('escuelas_create_campus', { p_data: parsed.data })
  if (error) throw new Error(error.message)
  revalidatePath(`/escuelas/admin/${parsed.data.school_id}/sedes`)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as Campus
}

// TODO: sin call site activo — ver auditoría QA (falta UI de edición de sedes)
export async function updateCampus(schoolId: string, campusId: string, formData: FormData) {
  await assertSchoolAdmin(schoolId)
  const parsed = CampusSchema.partial().omit({ school_id: true }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)
  const client = await getServerClient()
  const { data, error } = await client.rpc('escuelas_update_campus', {
    p_id:   campusId,
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/escuelas/admin/${schoolId}/sedes`)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as Campus
}
