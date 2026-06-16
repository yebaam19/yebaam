import { api } from './api'
import { getStoredUser } from './session'

export type TrackEventType =
  | 'REGISTER_SUCCESS'
  | 'LOGIN_SUCCESS'
  | 'BUSINESS_PROFILE_VIEW'
  | 'MENU_VIEW'
  | 'PRODUCT_VIEW'
  | 'GALLERY_OPEN'
  | 'VIDEO_PLAY'
  | 'REVIEW_SUBMIT'
  | 'PROMOTION_CLICK'
  | 'CTA_CLICK'
  | 'FOLLOW_BUSINESS'

type TrackEventInput = {
  eventType: TrackEventType
  entityType?: 'business' | 'product' | 'promotion' | string
  entityId?: number | string | null
  sourceScreen?: string
  metadata?: Record<string, unknown>
}

function getSessionId() {
  const key = 'session_id'
  const existing = localStorage.getItem(key)

  if (existing) return existing

  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem(key, next)
  return next
}

function getCurrentUserId() {
  return getStoredUser()?.id ?? null
}

export async function trackEvent(input: TrackEventInput) {
  try {
    await api.post('/events', {
      userId: getCurrentUserId(),
      eventType: input.eventType,
      entityType: input.entityType ?? null,
      entityId:
        typeof input.entityId === 'string'
          ? Number(input.entityId)
          : input.entityId ?? null,
      sourceScreen: input.sourceScreen ?? null,
      sessionId: getSessionId(),
      metadata: input.metadata ?? null,
    })
  } catch {
    // Analytics is best-effort and must never block navigation or actions.
  }
}

export async function trackCtaClick(input: {
  businessId: number | string
  productId?: number | string | null
  sourceScreen: string
}) {
  try {
    await api.post('/cta/click', {
      businessId: input.businessId,
      productId: input.productId ?? null,
      sourceScreen: input.sourceScreen,
    })
  } catch {
    // Best-effort tracking only.
  }
}
