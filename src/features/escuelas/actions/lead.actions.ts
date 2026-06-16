'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { EnrollmentLead, LeadStatus } from '../types'

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

const LeadSchema = z.object({
  school_id:                z.string().min(1),
  program_id:               z.string().min(1).optional(),
  name:                     z.string().min(2).max(120),
  email:                    z.string().min(1),
  phone:                    z.string().min(5).max(30),
  message:                  z.string().max(2000).optional(),
  preferred_contact_method: z.enum(['PHONE', 'WHATSAPP', 'EMAIL']),
  source_screen:            z.string().max(100).optional(),
})

export async function submitLead(formData: FormData) {
  const { userId, client } = await getOptionalSession()
  const parsed = LeadSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('escuelas_submit_lead', {
    p_user_id: userId,
    p_data:    parsed.data,
  })
  if (error) throw new Error(error.message)
  return data as EnrollmentLead
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { client } = await requireSession()
  const { error } = await client.rpc('escuelas_update_lead_status', {
    p_id:     leadId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/escuelas/admin/[schoolId]/leads', 'page')
}
