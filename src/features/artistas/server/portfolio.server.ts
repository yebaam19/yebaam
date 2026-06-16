import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { PortfolioItem } from '../types'

export const getPortfolioByProfile = cache(async (artistProfileId: string): Promise<PortfolioItem[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_portfolio_by_artist', { p_artist_profile_id: artistProfileId })
  if (error) throw new Error(error.message)
  return (data ?? []) as PortfolioItem[]
})

export const getPortfolioItemById = cache(async (id: string): Promise<PortfolioItem | null> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_portfolio_item_by_id', { p_id: id })
  if (error) throw new Error(error.message)
  return data as PortfolioItem | null
})
