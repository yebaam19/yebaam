'use server'

import { getServerClient } from '@/utils/supabase/server'
import { getAuthUser } from '@/features/auth/actions/auth.actions'

async function requireUser() {
  const user = await getAuthUser()
  if (!user) throw new Error('No autenticado')
  return user
}

export async function toggleFollow(businessId: string) {
  await requireUser()
  const client = await getServerClient()
  const { data, error } = await client.rpc('toggle_business_follow', {
    p_business_id: businessId,
  })
  if (error) throw new Error(error.message)
  return data as { is_following: boolean; followers_count: number }
}

export async function toggleLike(businessId: string) {
  await requireUser()
  const client = await getServerClient()
  const { data, error } = await client.rpc('toggle_business_like', {
    p_business_id: businessId,
  })
  if (error) throw new Error(error.message)
  return data as { has_liked: boolean; likes_count: number }
}

export async function toggleCustomer(businessId: string) {
  await requireUser()
  const client = await getServerClient()
  const { data, error } = await client.rpc('toggle_business_customer', {
    p_business_id: businessId,
  })
  if (error) throw new Error(error.message)
  return data as { is_customer: boolean; customers_count: number }
}
