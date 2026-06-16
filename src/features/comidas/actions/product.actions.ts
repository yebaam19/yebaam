'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient, getServiceClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { Product } from '../types'
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

const ProductSchema = z.object({
  category_id:       z.string().uuid(),
  business_id:       z.string().uuid(),
  name:              z.string().min(1).max(120),
  slug:              z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  short_description: z.string().max(200).optional(),
  description:       z.string().optional(),
  ingredients:       z.string().optional(),
  price:             z.coerce.number().nonnegative(),
  currency:          z.string().max(3).optional(),
  cf_image_id:       z.string().optional(),
  is_featured:       z.coerce.boolean().optional(),
  sort_order:        z.coerce.number().int().optional(),
})

export async function createProduct(formData: FormData) {
  const { client } = await requireSession()
  const parsed = ProductSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)
  await requireBusinessAdmin(parsed.data.business_id)

  const { data, error } = await client.rpc('comidas_create_product', { p_data: parsed.data })
  if (error) throw new Error(error.message)
  revalidatePath('/negocios/[slug]/menu', 'page')
  return data as Product
}

export async function updateProduct(productId: string, formData: FormData) {
  const { client } = await requireSession()

  // Lookup actual business_id server-side — the form sets it but we verify against the DB
  const sc = getServiceClient()
  const { data: prod } = await sc
    .schema('comidas')
    .from('products')
    .select('business_id')
    .eq('id', productId)
    .maybeSingle()
  if (!prod) throw new Error('Producto no encontrado')
  await requireBusinessAdmin(prod.business_id as string)

  const parsed = ProductSchema.partial().safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('comidas_update_product', {
    p_id:   productId,
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/negocios/[slug]/menu', 'page')
  return data as Product
}

export async function deactivateProduct(productId: string) {
  const { client } = await requireSession()

  // Lookup actual business_id server-side
  const sc = getServiceClient()
  const { data: prod } = await sc
    .schema('comidas')
    .from('products')
    .select('business_id')
    .eq('id', productId)
    .maybeSingle()
  if (!prod) throw new Error('Producto no encontrado')
  await requireBusinessAdmin(prod.business_id as string)

  const { error } = await client.rpc('comidas_deactivate_product', { p_id: productId })
  if (error) throw new Error(error.message)
  revalidatePath('/negocios/[slug]/menu', 'page')
}
