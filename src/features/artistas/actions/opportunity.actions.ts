'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { Opportunity, OpportunityApplication, OpportunityStatus } from '../types'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { userId: data.user.id, client }
}

const OpportunitySchema = z.object({
  slug:              z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  title:             z.string().min(2).max(150),
  description:       z.string().min(10),
  type:              z.enum([
    'CASTING', 'AUDITION', 'COLLABORATION', 'JOB', 'FESTIVAL',
    'EXHIBITION', 'CONTEST', 'CULTURAL_CALL', 'BRAND_CAMPAIGN', 'OTHER',
  ]),
  city:              z.string().max(100).optional(),
  country:           z.string().max(80).optional(),
  modality:          z.enum(['IN_PERSON', 'ONLINE', 'HYBRID', 'TO_BE_DEFINED']).optional(),
  deadline:          z.string().optional(),
  cover_cf_image_id: z.string().optional(),
  requirements:      z.string().optional(),
})

const ApplicationSchema = z.object({
  opportunity_id:    z.string().min(1),
  artist_profile_id: z.string().min(1),
  cover_letter:      z.string().max(5000).optional(),
})

export async function createOpportunity(formData: FormData) {
  const { userId, client } = await requireSession()
  const raw = Object.fromEntries(formData)
  const parsed = OpportunitySchema.safeParse(raw)
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const requirements = typeof raw.requirements === 'string' && raw.requirements
    ? raw.requirements.split('\n').map((r) => r.trim()).filter(Boolean)
    : []

  const { data, error } = await client.rpc('artistas_create_opportunity', {
    p_author_id: userId,
    p_data:      { ...parsed.data, requirements },
  })
  if (error) throw new Error(error.message)
  revalidatePath('/oportunidades')
  return data as Opportunity
}

export async function updateOpportunity(opportunityId: string, formData: FormData) {
  const { client } = await requireSession()
  const raw = Object.fromEntries(formData)
  const parsed = OpportunitySchema.partial().safeParse(raw)
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const requirements = typeof raw.requirements === 'string' && raw.requirements
    ? raw.requirements.split('\n').map((r) => r.trim()).filter(Boolean)
    : undefined

  const { data, error } = await client.rpc('artistas_update_opportunity', {
    p_id:   opportunityId,
    p_data: { ...parsed.data, ...(requirements !== undefined ? { requirements } : {}) },
  })
  if (error) throw new Error(error.message)
  revalidatePath('/oportunidades')
  return data as Opportunity
}

export async function updateOpportunityStatus(opportunityId: string, status: OpportunityStatus) {
  const { client } = await requireSession()
  const { error } = await client.rpc('artistas_update_opportunity_status', {
    p_id:     opportunityId,
    p_status: status,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/oportunidades')
}

export async function applyToOpportunity(formData: FormData) {
  const { userId, client } = await requireSession()
  const parsed = ApplicationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('artistas_apply_to_opportunity', {
    p_applicant_id: userId,
    p_data:         parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/oportunidades/[slug]', 'page')
  return data as OpportunityApplication
}
