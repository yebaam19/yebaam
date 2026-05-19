import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from './cf'

export type PromotionDuration = '1d' | '2d' | '3d' | '1w' | '2w' | '1m'
export type PromotionStatus = 'active' | 'expired' | 'removed'

export interface CityPromotion {
  id: string
  cityId: string
  title: string
  body: string | null
  coverImageUrl: string | undefined
  duration: PromotionDuration
  startsAt: string
  expiresAt: string
  status: PromotionStatus
  createdAt: string
}

type Row = {
  id: string
  city_id: string
  title: string
  body: string | null
  cover_cf_image_id: string | null
  duration: PromotionDuration
  starts_at: string
  expires_at: string
  status: PromotionStatus
  created_at: string
}

function toDto(r: Row): CityPromotion {
  return {
    id: r.id,
    cityId: r.city_id,
    title: r.title,
    body: r.body,
    coverImageUrl: cfImageUrl(r.cover_cf_image_id),
    duration: r.duration,
    startsAt: r.starts_at,
    expiresAt: r.expires_at,
    status: r.status,
    createdAt: r.created_at,
  }
}

export async function fetchActivePromotions(
  client: SupabaseClient,
  cityId: string,
): Promise<CityPromotion[]> {
  const now = new Date().toISOString()
  const { data, error } = await client
    .from('city_promotions')
    .select(
      'id, city_id, title, body, cover_cf_image_id, duration, starts_at, expires_at, status, created_at',
    )
    .eq('city_id', cityId)
    .eq('status', 'active')
    .gt('expires_at', now)
    .order('starts_at', { ascending: false })
  if (error) {
    console.error('[fetchActivePromotions]', error)
    return []
  }
  return ((data ?? []) as Row[]).map(toDto)
}

export const getActivePromotions = cache(async (cityId: string) => {
  const client = await getServerClient()
  return fetchActivePromotions(client, cityId)
})

const DURATION_MS: Record<PromotionDuration, number> = {
  '1d': 1 * 24 * 60 * 60 * 1000,
  '2d': 2 * 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '2w': 14 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
}

export function computeExpiresAt(duration: PromotionDuration, startsAt: Date): Date {
  return new Date(startsAt.getTime() + DURATION_MS[duration])
}
