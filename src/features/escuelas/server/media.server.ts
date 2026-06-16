import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { MediaAsset } from '../types'

export const getMediaBySchool = cache(async (schoolId: string): Promise<MediaAsset[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_media_by_school', { p_school_id: schoolId })
  if (error) throw new Error(error.message)
  return (data ?? []) as MediaAsset[]
})
