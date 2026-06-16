import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { ArtistEvent } from '../types'

export const listArtistEvents = cache(async (): Promise<ArtistEvent[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('list_artist_events', {})
  if (error) throw new Error(error.message)
  return (data ?? []) as ArtistEvent[]
})
