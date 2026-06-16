import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import type { TrialClassRequest } from '../types'

export const getTrialRequestsBySchool = cache(async (schoolId: string): Promise<TrialClassRequest[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_trial_requests_by_school', { p_school_id: schoolId })
  if (error) throw new Error(error.message)
  return (data ?? []) as TrialClassRequest[]
})
