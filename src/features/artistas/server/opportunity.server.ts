import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { Opportunity } from '../types'

export const listOpportunities = cache(async (): Promise<Opportunity[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_opportunities', {})
  if (error) throw new Error(error.message)
  return (data ?? []) as Opportunity[]
})

export const getOpportunityBySlug = cache(async (slug: string): Promise<Opportunity | null> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_opportunity_by_slug', { p_slug: slug })
  if (error) throw new Error(error.message)
  return data as Opportunity | null
})

export const getMyOpportunities = cache(async (userId: string): Promise<Opportunity[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_my_opportunities', { p_user_id: userId })
  if (error) throw new Error(error.message)
  return (data ?? []) as Opportunity[]
})
