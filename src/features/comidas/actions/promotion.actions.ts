'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { Promotion } from '../types'
import { isUserBusinessAdmin } from '../server/business.server'
import { revalidateBusinessAdmin } from '../lib/revalidate-admin'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { userId: data.user.id, client }
}

async function requireBusinessAdmin(businessId: string) {
  if (!(await isUserBusinessAdmin(businessId))) {
    throw new Error('No tienes permisos para administrar este negocio')
  }
}

const PromotionSchema = z.object({
  business_id:    z.string().uuid(),
  title:          z.string().min(2).max(120),
  slug:           z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description:    z.string().optional(),
  cf_image_id:    z.string().optional(),
  cta_label:      z.string().max(60).optional(),
  cta_url:        z.string().optional(),
  starts_at:      z.string().optional(),
  ends_at:        z.string().optional(),
  status:         z.enum(['DRAFT','ACTIVE','EXPIRED','ARCHIVED']).optional(),
  is_highlighted: z.coerce.boolean().optional(),
})

export async function createPromotion(formData: FormData) {
  const { client } = await requireSession()
  const parsed = PromotionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)
  await requireBusinessAdmin(parsed.data.business_id)

  const { data, error } = await client.rpc('comidas_create_promotion', { p_data: parsed.data })
  if (error) throw new Error(error.message)
  revalidatePath('/promociones')
  revalidatePath('/negocios/[slug]', 'page')
  revalidateBusinessAdmin(parsed.data.business_id, 'promociones')
  return data as Promotion
}

export async function updatePromotion(promotionId: string, formData: FormData) {
  const { client } = await requireSession()

  // Lookup actual business_id server-side. comidas isn't exposed via PostgREST,
  // so go through an RPC instead of a direct schema-scoped REST query (which
  // fails with PGRST106).
  const { data: ownerBusinessId, error: lookupError } = await client.rpc('get_promotion_business_id', {
    p_promotion_id: promotionId,
  })
  if (lookupError) throw new Error(`Error al buscar la promoción: ${lookupError.message} (code: ${lookupError.code})`)
  if (!ownerBusinessId) throw new Error('Promoción no encontrada')
  const businessId = ownerBusinessId as string
  await requireBusinessAdmin(businessId)

  const parsed = PromotionSchema.partial().safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('comidas_update_promotion', {
    p_id:   promotionId,
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/promociones')
  revalidateBusinessAdmin(businessId, 'promociones')
  return data as Promotion
}

export async function deactivatePromotion(promotionId: string) {
  const { client } = await requireSession()

  // Lookup actual business_id server-side — see comment in updatePromotion above.
  const { data: ownerBusinessId, error: lookupError } = await client.rpc('get_promotion_business_id', {
    p_promotion_id: promotionId,
  })
  if (lookupError) throw new Error(`Error al buscar la promoción: ${lookupError.message} (code: ${lookupError.code})`)
  if (!ownerBusinessId) throw new Error('Promoción no encontrada')
  const businessId = ownerBusinessId as string
  await requireBusinessAdmin(businessId)

  const { error } = await client.rpc('comidas_deactivate_promotion', { p_id: promotionId })
  if (error) throw new Error(error.message)
  revalidatePath('/promociones')
  revalidateBusinessAdmin(businessId, 'promociones')
}
