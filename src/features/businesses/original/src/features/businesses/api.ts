import { api } from '../../lib/api'

export type BusinessListItem = {
  id: number
  name: string
  slug?: string
  category?: string
  description?: string
  city?: string
  address?: string
  phone?: string
  whatsapp?: string
  ratingAverage?: number
  reviewsCount?: number
  activePromotionsCount?: number
  likesCount?: number
  profileImageUrl?: string | null
  isVerified?: boolean
  cover?: {
    url?: string
  } | null
  primaryAdmin?: {
    id: number
    name: string
    email: string
    isActive: boolean
  } | null
  admins?: Array<{
    id: number
    isPrimary: boolean
    user: {
      id: number
      name: string
      email: string
      isActive: boolean
    }
  }>
  productsCount?: number
  createdAt?: string
  updatedAt?: string
  isActive: boolean
}

export type BusinessLikeState = {
  hasLiked: boolean
  likesCount: number
}

export type BusinessFollowState = {
  isFollowing: boolean
  followersCount: number
}

export type BusinessCustomerState = {
  isCustomer: boolean
  customersCount: number
}

export type BusinessCommunityUser = {
  id: number
  name: string
  username: string | null
  avatarUrl: string | null
  createdAt: string
}

export type PaginatedBusinessCommunityResponse = {
  items: BusinessCommunityUser[]
  total: number
  page: number
  limit: number
}

export async function listBusinesses() {
  const response = await api.get('/businesses')
  return (response.data?.data ?? []) as BusinessListItem[]
}

export async function listBusinessesForAdmin() {
  const response = await api.get('/businesses/admin')
  return (response.data?.data ?? []) as BusinessListItem[]
}

export async function getBusinessForAdminById<T = unknown>(id: number | string) {
  const response = await api.get(`/businesses/admin/${id}`)
  return response.data?.data as T
}

export async function getBusinessById<T = unknown>(id: number | string) {
  const response = await api.get(`/businesses/${id}`)
  return response.data?.data as T
}

export async function toggleBusinessLike(id: number | string) {
  const response = await api.post(`/businesses/${id}/like`)
  return response.data?.data as BusinessLikeState
}

export async function toggleBusinessFollow(id: number | string) {
  const response = await api.post(`/businesses/${id}/follow`)
  return response.data?.data as BusinessFollowState
}

export async function toggleBusinessCustomer(id: number | string) {
  const response = await api.post(`/businesses/${id}/customer`)
  return response.data?.data as BusinessCustomerState
}

export async function getBusinessCustomers(id: number | string, limit: number = 6, page: number = 1) {
  const response = await api.get(`/businesses/${id}/customers`, {
    params: { limit, page },
  })
  return response.data?.data as PaginatedBusinessCommunityResponse
}

export async function getBusinessFollowers(id: number | string, limit: number = 6, page: number = 1) {
  const response = await api.get(`/businesses/${id}/followers`, {
    params: { limit, page },
  })
  return response.data?.data as PaginatedBusinessCommunityResponse
}

export async function updateBusinessProfileImage<T = unknown>(
  id: number | string,
  profileImageUrl: string
) {
  const response = await api.patch(`/businesses/${id}/profile-image`, {
    profileImageUrl,
  })
  return response.data?.data as T
}

export async function updateBusinessById<T = unknown>(
  id: number | string,
  payload: Record<string, unknown>
) {
  const response = await api.patch(`/businesses/${id}`, payload)
  return response.data?.data as T
}

export async function updateBusinessStatus<T = unknown>(
  id: number | string,
  isActive: boolean
) {
  const response = await api.patch(`/businesses/${id}/status`, { isActive })
  return response.data?.data as T
}

export async function createBusiness<T = unknown>(payload: Record<string, unknown>) {
  const response = await api.post('/businesses', payload)
  return response.data?.data as T
}

export async function deleteBusinessById(id: number | string) {
  const response = await api.delete(`/businesses/${id}`)
  return response.data?.data as { id: number; name: string; slug: string }
}
