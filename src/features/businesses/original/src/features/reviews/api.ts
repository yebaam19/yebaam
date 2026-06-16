import { api } from '../../lib/api'

export async function getBusinessReviews<T = unknown>(businessId: number | string) {
  const response = await api.get(`/businesses/${businessId}/reviews`)
  return response.data?.data as T
}

export async function createReview<T = unknown>(payload: {
  businessId: number | string
  rating: number
  comment?: string
}) {
  const response = await api.post('/reviews', payload)
  return response.data?.data as T
}
