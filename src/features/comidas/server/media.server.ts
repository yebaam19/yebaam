import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { MediaAsset } from '../types'

export const getMediaByBusiness = cache(async (businessId: string): Promise<MediaAsset[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_media_by_business', { p_business_id: businessId })
  if (error) throw new Error(error.message)
  return (data ?? []) as MediaAsset[]
})
