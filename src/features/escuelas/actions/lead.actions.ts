'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import type { EnrollmentLead, LeadStatus } from '../types'
import { assertSchoolAdmin } from '../server/school.server'

const LeadSchema = z.object({
  school_id:                z.string().uuid(),
  program_id:               z.string().uuid().optional(),
  name:                     z.string().min(2).max(120),
  email:                    z.string().email(),
  phone:                    z.string().min(5).max(30),
  message:                  z.string().max(2000).optional(),
  preferred_contact_method: z.enum(['PHONE', 'WHATSAPP', 'EMAIL']),
  source_screen:            z.string().max(100).optional(),
})

export async function submitLead(formData: FormData) {
  // Lead form is public — no session required, user_id is derived server-side by the RPC
  const client = await getServerClient()
  const parsed = LeadSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('escuelas_submit_lead', {
    p_data: parsed.data,
  })
  if (error) {
    Sentry.captureException(error, { tags: { action: 'submitLead' } })
    throw new Error(error.message)
  }
  return data as EnrollmentLead
}

export async function updateLeadStatus(leadId: string, status: LeadStatus, schoolId: string) {
  // assertSchoolAdmin: auth check + school_admins table + created_by fallback
  await assertSchoolAdmin(schoolId)
  const client = await getServerClient()
  const { error } = await client.rpc('escuelas_update_lead_status', {
    p_id:        leadId,
    p_status:    status,
    p_school_id: schoolId,
  })
  if (error) {
    Sentry.captureException(error, { tags: { action: 'updateLeadStatus', leadId, schoolId } })
    throw new Error(error.message)
  }
  revalidatePath(`/escuelas/admin/${schoolId}/leads`)
}
