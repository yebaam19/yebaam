import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'

export interface BusinessStats {
  reviews: number
  follows: number
  likes: number
  posts: number
  reactions: number
  comments: number
  lastPostAt: string | null
}

export interface BusinessAnalytics {
  follows:   { total: number; week: number; prev_week: number; month: number }
  likes:     { total: number; week: number; prev_week: number }
  customers: { total: number; week: number }
  reviews:   { total: number; week: number; avg_rating: number }
  posts:     { total: number; week: number }
}

export const fetchBusinessStats = cache(async (businessId: string): Promise<BusinessStats> => {
  const client = await getServerClient()
  const [statsRes, lastPostRes] = await Promise.all([
    client.rpc('get_comidas_stats', { p_business_id: businessId }),
    client
      .from('posts')
      .select('created_at')
      .eq('business_id', businessId)
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  const d = (statsRes.data ?? {}) as Partial<BusinessStats>
  return {
    reviews:    d.reviews   ?? 0,
    follows:    d.follows   ?? 0,
    likes:      d.likes     ?? 0,
    posts:      d.posts     ?? 0,
    reactions:  d.reactions ?? 0,
    comments:   d.comments  ?? 0,
    lastPostAt: lastPostRes.data?.created_at ?? null,
  }
})

export const fetchBusinessAnalytics = cache(async (businessId: string): Promise<BusinessAnalytics> => {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_business_analytics', { p_business_id: businessId })
  if (error) throw new Error(error.message)
  const raw = (data ?? {}) as Record<string, Record<string, number>>
  return {
    follows:   { total: raw.follows?.total ?? 0, week: raw.follows?.week ?? 0, prev_week: raw.follows?.prev_week ?? 0, month: raw.follows?.month ?? 0 },
    likes:     { total: raw.likes?.total ?? 0, week: raw.likes?.week ?? 0, prev_week: raw.likes?.prev_week ?? 0 },
    customers: { total: raw.customers?.total ?? 0, week: raw.customers?.week ?? 0 },
    reviews:   { total: raw.reviews?.total ?? 0, week: raw.reviews?.week ?? 0, avg_rating: raw.reviews?.avg_rating ?? 0 },
    posts:     { total: raw.posts?.total ?? 0, week: raw.posts?.week ?? 0 },
  }
})
