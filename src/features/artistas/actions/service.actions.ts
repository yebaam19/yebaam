'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { ServiceOffer } from '../types'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { client }
}

const ServiceOfferSchema = z.object({
  artist_profile_id: z.string().min(1),
  title:             z.string().min(2).max(120),
  description:       z.string().optional(),
  service_type:      z.enum([
    'LIVE_PERFORMANCE', 'PRIVATE_EVENT', 'BRAND_COLLABORATION', 'TEACHING',
    'PRODUCTION', 'CONSULTING', 'COMMISSION_WORK', 'SESSION_WORK',
    'CONTENT_CREATION', 'OTHER',
  ]),
  price_from:    z.coerce.number().nonnegative().optional(),
  currency:      z.string().max(3).optional(),
  location_mode: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID', 'TO_BE_DEFINED']).optional(),
})

export async function createServiceOffer(formData: FormData) {
  const { client } = await requireSession()
  const parsed = ServiceOfferSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('artistas_create_service_offer', {
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]/servicios', 'page')
  return data as ServiceOffer
}

export async function deactivateServiceOffer(offerId: string) {
  const { client } = await requireSession()
  const { error } = await client.rpc('artistas_deactivate_service_offer', { p_id: offerId })
  if (error) throw new Error(error.message)
  revalidatePath('/artistas/[slug]/servicios', 'page')
}
