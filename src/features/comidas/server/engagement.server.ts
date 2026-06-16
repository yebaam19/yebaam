import { cache } from 'react'
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
  async (businessId: string, userId: string): Promise<EngagementState> => {
    const client = await getServerClient()
    const { data, error } = await client.rpc('get_business_engagement', {
      p_business_id: businessId,
      p_user_id: userId,
    })
    if (error) throw new Error(error.message)
    return (data ?? EMPTY) as EngagementState
  }
)

export const getFollowedBusinesses = cache(
  async (userId: string, limit = 48) => {
    try {
      const client = await getServerClient()
      const { data, error } = await client.rpc('get_businesses_followed_by_user', {
        p_user_id: userId,
        p_limit:   limit,
      })
      if (error) throw new Error(error.message)
      return (data ?? []) as Business[]
    } catch {
      return []
    }
  }
)

export const getBusinessCommunityPreviews = cache(
  async (businessId: string): Promise<CommunityPreviews> => {
    try {
      const client = await getServerClient()
      const [customersRes, followersRes] = await Promise.all([
        client.rpc('get_business_customers_preview', { p_business_id: businessId, p_limit: 6 }),
        client.rpc('get_business_followers_preview', { p_business_id: businessId, p_limit: 6 }),
      ])
      return {
        customers: (customersRes.data ?? []) as CommunityUserPreview[],
        followers: (followersRes.data ?? []) as CommunityUserPreview[],
      }
    } catch {
      return { customers: [], followers: [] }
    }
  }
)
