'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { Campus } from '../types'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { client }
}

const CampusSchema = z.object({
  school_id: z.string().min(1),
  name:      z.string().min(2).max(150),
  city:      z.string().min(2).max(100),
  address:   z.string().min(5).max(300),
  phone:     z.string().min(7).max(30),
})

export async function createCampus(formData: FormData) {
  const { client } = await requireSession()
  const parsed = CampusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('escuelas_create_campus', { p_data: parsed.data })
  if (error) throw new Error(error.message)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as Campus
}

export async function updateCampus(campusId: string, formData: FormData) {
  const { client } = await requireSession()
  const parsed = CampusSchema.partial().omit({ school_id: true }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('escuelas_update_campus', {
    p_id:   campusId,
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/escuelas/[slug]', 'page')
  return data as Campus
}
