import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { ArtistCampaign } from '../types'

export const listArtistCampaigns = cache(async (): Promise<ArtistCampaign[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('list_artist_campaigns', {})
  if (error) throw new Error(error.message)
  return (data ?? []) as ArtistCampaign[]
})
