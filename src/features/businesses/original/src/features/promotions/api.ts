import { api } from '../../lib/api'

export type PromotionStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED'

export type PromotionBusiness = {
  id: number
  name: string
  category?: string | null
  city?: string | null
}

export type PromotionRecord = {
  id: number
  businessId: number
  title: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  startsAt?: string | null
  endsAt?: string | null
  status: PromotionStatus
  isHighlighted: boolean
  createdAt?: string
  updatedAt?: string
  business?: PromotionBusiness
}

export type PromotionInput = {
  businessId: number
  title: string
  slug?: string
  description?: string | null
  imageUrl?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  startsAt?: string | null
  endsAt?: string | null
  status?: PromotionStatus
  isHighlighted?: boolean
}

export async function listPromotions(params?: {
  businessId?: number
  status?: PromotionStatus | 'ALL'
}) {
  const response = await api.get('/promotions', { params })
  return (response.data?.data ?? []) as PromotionRecord[]
}

export async function listPromotionsByBusinessId(businessId: number) {
  const response = await api.get(`/promotions/businesses/${businessId}/promotions`)
  return (response.data?.data ?? []) as PromotionRecord[]
}

export async function getPromotionById(id: number | string) {
  const response = await api.get(`/promotions/${id}`)
  return response.data?.data as PromotionRecord
}

export async function createPromotion(payload: PromotionInput) {
  const response = await api.post('/promotions', payload)
  return response.data?.data as PromotionRecord
}

export async function updatePromotionById(
  id: number | string,
  payload: Partial<PromotionInput>
) {
  const response = await api.patch(`/promotions/${id}`, payload)
  return response.data?.data as PromotionRecord
}

export async function deactivatePromotionById(id: number | string) {
  const response = await api.patch(`/promotions/${id}/deactivate`)
  return response.data?.data as PromotionRecord
}
