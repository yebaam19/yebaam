'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { Business } from '../types'
import { isUserBusinessAdmin } from '../server/business.server'

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

const CreateBusinessSchema = z.object({
  name:                z.string().min(2).max(120),
  slug:                z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  category:            z.string().min(1),
  business_type:       z.string().optional(),
  description:         z.string().optional(),
  about_article:       z.string().optional(),
  city:                z.string().optional(),
  address:             z.string().optional(),
  phone:               z.string().optional(),
  whatsapp:            z.string().optional(),
  email:               z.string().email().optional().or(z.literal('')),
  website:             z.string().url().optional().or(z.literal('')),
  instagram:           z.string().optional(),
  facebook:            z.string().optional(),
  tiktok:              z.string().optional(),
  founded_at:          z.string().optional(),
  capacity:            z.coerce.number().int().positive().optional(),
  profile_cf_image_id: z.string().optional(),
})

const UpdateBusinessSchema = CreateBusinessSchema.partial().extend({
  is_active: z.boolean().optional(),
})

export async function createBusiness(formData: FormData) {
  const { client } = await requireSession()
  const parsed = CreateBusinessSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('comidas_create_business', {
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/negocios')
  revalidatePath('/feed/mis-negocios')
  return data as Business
}

export async function updateBusiness(businessId: string, formData: FormData) {
  const { client } = await requireSession()
  await requireBusinessAdmin(businessId)
  const parsed = UpdateBusinessSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('comidas_update_business', {
    p_id:   businessId,
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  const updated = data as Business
  revalidatePath(`/negocios/${updated.slug}`)
  revalidatePath(`/negocios/admin/${businessId}/settings`)
  revalidatePath(`/negocios/admin/${businessId}`)
  return updated
}

export async function updateBusinessStatus(businessId: string, isActive: boolean) {
  const { client } = await requireSession()
  await requireBusinessAdmin(businessId)
  const { error } = await client.rpc('comidas_update_business_status', {
    p_id:        businessId,
    p_is_active: isActive,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/negocios')
  revalidatePath(`/negocios/admin/${businessId}`)
  revalidatePath(`/negocios/admin/${businessId}/settings`)
}
