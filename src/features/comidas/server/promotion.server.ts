import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { Promotion } from '../types'

export const listActivePromotions = cache(async (): Promise<Promotion[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('list_active_promotions', {})
  if (error) throw new Error(error.message)
  return (data ?? []) as Promotion[]
})

export const getPromotionById = cache(async (id: string): Promise<Promotion | null> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_promotion_by_id', { p_id: id })
  if (error) throw new Error(error.message)
  return data as Promotion | null
})

export const getPromotionsByBusiness = cache(async (businessId: string): Promise<Promotion[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_promotions_by_business', { p_business_id: businessId })
  if (error) throw new Error(error.message)
  return (data ?? []) as Promotion[]
})
