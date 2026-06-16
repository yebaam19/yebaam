import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { ArtistProfile, ArtistProfileDetail, ServiceOffer, ArtistFilters } from '../types'

export const listArtistProfiles = cache(async (filters: ArtistFilters = {}) => {
  const client = await getServerClient()
  const { page = 1, limit = 24, artist_type, city, search } = filters
  const { data: result, error } = await client.rpc('get_artist_profiles', {
    p_artist_type: artist_type ?? null,
    p_city:        city        ?? null,
    p_search:      search      ?? null,
    p_page:        page,
    p_limit:       limit,
  })
  if (error) throw new Error(error.message)
  const r = (result ?? { data: [], count: 0 }) as { data: ArtistProfile[]; count: number }
  return { data: r.data ?? [], count: r.count ?? 0 }
})

export const getArtistProfileBySlug = cache(async (slug: string): Promise<ArtistProfileDetail | null> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_artist_by_slug', { p_slug: slug })
  if (error) throw new Error(error.message)
  return data as ArtistProfileDetail | null
})

export const getOwnArtistProfile = cache(async (userId: string, slug: string): Promise<ArtistProfile | null> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_own_artist_profile', { p_user_id: userId, p_slug: slug })
  if (error) throw new Error(error.message)
  return data as ArtistProfile | null
})

export const getServiceOffers = cache(async (artistProfileId: string): Promise<ServiceOffer[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_service_offers', { p_artist_profile_id: artistProfileId })
  if (error) throw new Error(error.message)
  return (data ?? []) as ServiceOffer[]
})

export const getManagedArtists = cache(async (managerId: string): Promise<ArtistProfile[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_managed_artists', { p_manager_id: managerId })
  if (error) throw new Error(error.message)
  return (data ?? []) as ArtistProfile[]
})
