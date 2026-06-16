'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { TrialClassRequest, TrialStatus } from '../types'

async function getOptionalSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  return { userId: data.user?.id ?? null, client }
}

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { client }
}

const TrialSchema = z.object({
  school_id:      z.string().min(1),
  program_id:     z.string().min(1).optional(),
  name:           z.string().min(2).max(120),
  email:          z.string().min(1),
  phone:          z.string().min(5).max(30),
  preferred_date: z.string().min(1),
  message:        z.string().max(1000).optional(),
})

export async function requestTrialClass(formData: FormData) {
  const { userId, client } = await getOptionalSession()
  const parsed = TrialSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('escuelas_request_trial', {
    p_user_id: userId,
    p_data:    parsed.data,
  })
  if (error) throw new Error(error.message)
  return data as TrialClassRequest
}

export async function updateTrialStatus(trialId: string, status: TrialStatus) {
  const { client } = await requireSession()
  const { error } = await client.rpc('escuelas_update_trial_status', {
    p_id:     trialId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/escuelas/admin/[schoolId]/solicitudes', 'page')
}
