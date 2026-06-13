import 'server-only'

import { cache } from 'react'

import { getServerClient } from '@/utils/supabase/server'

/**
 * Service-publishing eligibility (PDF rule: only a verified professional profile
 * may publish a service).
 */

export interface ServiceEligibility {
  eligible: boolean
  hasProfile: boolean
  professionalProfileId: string | null
}

export const getMyServiceEligibility = cache(async (): Promise<ServiceEligibility> => {
  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return { eligible: false, hasProfile: false, professionalProfileId: null }

  const { data: profile } = await client
    .from('professional_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  const professionalProfileId = (profile as { id: string } | null)?.id ?? null

  const { data: eligible } = await client.rpc('has_verified_professional_profile')
  return {
    eligible: Boolean(eligible),
    hasProfile: Boolean(professionalProfileId),
    professionalProfileId,
  }
})
