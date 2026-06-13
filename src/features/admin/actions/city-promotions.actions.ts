'use server'

import {
  type ActionResult,
  requireAdminWithUser,
  setCityRowStatus,
  deleteCityRow,
  insertCityRow,
} from './_shared'

/** Admin-only CRUD + moderation for time-boxed city promotions. */

type PromotionDuration = '1d' | '2d' | '3d' | '1w' | '2w' | '1m'
const PROMOTION_DURATIONS = new Set<PromotionDuration>(['1d', '2d', '3d', '1w', '2w', '1m'])
const PROMOTION_STATUSES = new Set(['active', 'expired', 'removed'])

const DURATION_MS: Record<PromotionDuration, number> = {
  '1d': 1 * 24 * 60 * 60 * 1000,
  '2d': 2 * 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '2w': 14 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
}

export async function createCityPromotion(input: {
  cityId: string
  title: string
  body?: string | null
  duration: PromotionDuration
  coverCfImageId?: string | null
}): Promise<ActionResult<{ id: string }>> {
  const { client, userId } = await requireAdminWithUser()
  if (!input.cityId) return { ok: false, error: 'city_required' }
  const title = (input.title ?? '').trim()
  if (!title) return { ok: false, error: 'title_required' }
  if (!PROMOTION_DURATIONS.has(input.duration)) return { ok: false, error: 'invalid_duration' }

  const startsAt = new Date()
  const expiresAt = new Date(startsAt.getTime() + DURATION_MS[input.duration])

  return insertCityRow({
    client,
    table: 'city_promotions',
    payload: {
      city_id: input.cityId,
      author_id: userId,
      title,
      body: (input.body ?? '').trim() || null,
      cover_cf_image_id: input.coverCfImageId ?? null,
      duration: input.duration,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'active',
    },
    cityId: input.cityId,
    section: 'promotions',
  })
}

export async function setCityPromotionStatus(input: {
  promotionId: string
  status: 'active' | 'expired' | 'removed'
}): Promise<ActionResult<{ id: string; status: string }>> {
  return setCityRowStatus({
    table: 'city_promotions',
    id: input.promotionId,
    status: input.status,
    valid: PROMOTION_STATUSES,
    section: 'promotions',
  })
}

export async function deleteCityPromotion(input: {
  promotionId: string
}): Promise<ActionResult<{ id: string }>> {
  return deleteCityRow({
    table: 'city_promotions',
    id: input.promotionId,
    section: 'promotions',
  })
}
