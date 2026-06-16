'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/utils/supabase/server'
import { z } from 'zod'
import type { Review } from '../types'

async function requireSession() {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('No autenticado')
  return { userId: data.user.id, client }
}

const ReviewSchema = z.object({
  business_id: z.string().uuid(),
  rating:      z.coerce.number().int().min(1).max(5),
  comment:     z.string().max(2000).optional(),
})

export async function createReview(formData: FormData) {
  const { client } = await requireSession()
  const parsed = ReviewSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error('Datos inválidos: ' + parsed.error.message)

  const { data, error } = await client.rpc('comidas_create_review', {
    p_data: parsed.data,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/negocios/[slug]', 'page')
  return data as Review
}
