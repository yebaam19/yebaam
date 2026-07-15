'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import type { TrialClassRequest, TrialStatus } from '../types'
import { assertSchoolAdmin } from '../server/school.server'

const TrialSchema = z.object({
  school_id:      z.string().uuid(),
  program_id:     z.string().uuid().optional(),
  name:           z.string().min(2).max(120),
  email:          z.string().email(),
  phone:          z.string().min(5).max(30),
  preferred_date: z.string().min(1),
  message:        z.string().max(1000).optional(),
})

export async function requestTrialClass(formData: FormData) {
  // Public form — no session required, user_id derived by RPC from auth.uid()
  const client = await getServerClient()
  const parsed = TrialSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('escuelas_request_trial', {
    p_data: parsed.data,
  })
  if (error) {
    Sentry.captureException(error, { tags: { action: 'requestTrialClass' } })
    throw new Error(error.message)
  }
  return data as TrialClassRequest
}

export async function updateTrialStatus(trialId: string, status: TrialStatus, schoolId: string) {
  // assertSchoolAdmin: auth check + school_admins table + created_by fallback
  await assertSchoolAdmin(schoolId)
  const client = await getServerClient()
  const { error } = await client.rpc('escuelas_update_trial_status', {
    p_id:        trialId,
    p_status:    status,
    p_school_id: schoolId,
  })
  if (error) {
    Sentry.captureException(error, { tags: { action: 'updateTrialStatus', trialId, schoolId } })
    throw new Error(error.message)
  }
  revalidatePath(`/escuelas/admin/${schoolId}/solicitudes`)
}
