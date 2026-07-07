import { cache } from 'react'
import * as Sentry from '@sentry/nextjs'
import { getServerClient } from '@/utils/supabase/server'
import type { Business, CommunityUserPreview } from '../types'

export interface EngagementState {
  is_followed: boolean
  is_liked: boolean
  is_customer: boolean
  followers_count: number
  likes_count: number
  customers_count: number
}

export interface CommunityPreviews {
  customers: CommunityUserPreview[]
  followers: CommunityUserPreview[]
}

const EMPTY: EngagementState = {
  is_followed: false,
  is_liked: false,
  is_customer: false,
  followers_count: 0,
  likes_count: 0,
  customers_count: 0,
}

export const getBusinessEngagement = cache(
  async (businessId: string): Promise<EngagementState> => {
    const client = await getServerClient()
    const { data, error } = await client.rpc('get_business_engagement', {
      p_business_id: businessId,
    })
    if (error) throw new Error(error.message)
    return (data ?? EMPTY) as EngagementState
  }
)

export const getFollowedBusinesses = cache(
  async (limit = 48) => {
    const client = await getServerClient()
    const { data, error } = await client.rpc('get_businesses_followed_by_user', {
      p_limit: limit,
    })
    if (error) {
      // Degrades to an empty list in the UI either way — but a real RPC
      // failure here must be visible to SRE, not indistinguishable from
      // "this user just doesn't follow anyone".
      Sentry.captureException(error, { tags: { rpc: 'get_businesses_followed_by_user' } })
      return []
    }
    return (data ?? []) as Business[]
  }
)

export const getBusinessCommunityPreviews = cache(
  async (businessId: string): Promise<CommunityPreviews> => {
    const client = await getServerClient()
    const [customersRes, followersRes] = await Promise.all([
      client.rpc('get_business_customers_preview', { p_business_id: businessId, p_limit: 6 }),
      client.rpc('get_business_followers_preview', { p_business_id: businessId, p_limit: 6 }),
    ])
    // These two RPCs are flagged orphaned in the DB audit (no migration
    // currently defines them) — until that's resolved, every call here
    // fails with PGRST202. Reporting explicitly so the gap stays visible
    // in Sentry instead of silently rendering as "no customers/followers yet".
    if (customersRes.error) {
      Sentry.captureException(customersRes.error, { tags: { rpc: 'get_business_customers_preview', businessId } })
    }
    if (followersRes.error) {
      Sentry.captureException(followersRes.error, { tags: { rpc: 'get_business_followers_preview', businessId } })
    }
    return {
      customers: (customersRes.data ?? []) as CommunityUserPreview[],
      followers: (followersRes.data ?? []) as CommunityUserPreview[],
    }
  }
)
