import { cache } from 'react'
import * as Sentry from '@sentry/nextjs'
import { getServerClient } from '@/utils/supabase/server'
import type { EnrollmentLead } from '../types'

export const getLeadsBySchool = cache(async (schoolId: string): Promise<EnrollmentLead[]> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_enrollment_leads', { p_school_id: schoolId })
  if (error) {
    Sentry.captureException(error, { tags: { rpc: 'get_enrollment_leads', schoolId } })
    throw new Error(error.message)
  }
  return (data ?? []) as EnrollmentLead[]
})
