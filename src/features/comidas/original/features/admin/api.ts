import { api } from '../../lib/api'

export type AdminActivityItem = {
  id: number
  action: string
  entity: string
  entityId?: number | null
  message: string
  createdAt: string
  user?: {
    id: number
    name: string
    email: string
  } | null
}

export type AdminDashboardMetrics = {
  totalBusinesses: number
  activeBusinesses: number
  inactiveBusinesses: number
  totalBusinessAdmins: number
  totalProducts: number
  totalReviews: number
  recentActivity: AdminActivityItem[]
}

export type BusinessAdminBusiness = {
  id: number
  name: string
  slug: string
  city?: string | null
  isActive: boolean
  relationId?: number
  isPrimary?: boolean
}

export type BusinessAdminUser = {
  id: number
  name: string
  email: string
  role: 'BUSINESS_ADMIN'
  isActive: boolean
  createdAt: string
  updatedAt: string
  businessIds: number[]
  businesses: BusinessAdminBusiness[]
  primaryBusiness?: BusinessAdminBusiness | null
}

export type BusinessAdminPayload = {
  name: string
  email: string
  password?: string
  isActive: boolean
  businessId?: number | null
}

export async function getAdminDashboard() {
  const response = await api.get('/admin/dashboard')
  return response.data?.data as AdminDashboardMetrics
}

export async function listAdminActivity(limit = 50) {
  const response = await api.get('/admin/activity', { params: { limit } })
  return (response.data?.data ?? []) as AdminActivityItem[]
}

export async function listBusinessAdmins() {
  const response = await api.get('/admin/business-admins')
  return (response.data?.data ?? []) as BusinessAdminUser[]
}

export async function getBusinessAdminById(id: number | string) {
  const response = await api.get(`/admin/business-admins/${id}`)
  return response.data?.data as BusinessAdminUser
}

export async function createBusinessAdmin(payload: Required<Pick<BusinessAdminPayload, 'name' | 'email' | 'password' | 'isActive'>> & { businessId?: number | null }) {
  const response = await api.post('/admin/business-admins', payload)
  return response.data?.data as BusinessAdminUser
}

export async function updateBusinessAdmin(
  id: number | string,
  payload: Omit<BusinessAdminPayload, 'password'>
) {
  const response = await api.patch(`/admin/business-admins/${id}`, payload)
  return response.data?.data as BusinessAdminUser
}

export async function updateBusinessAdminStatus(
  id: number | string,
  isActive: boolean
) {
  const response = await api.patch(`/admin/business-admins/${id}/status`, {
    isActive,
  })
  return response.data?.data as BusinessAdminUser
}

export async function updateBusinessAdminPassword(
  id: number | string,
  password: string
) {
  const response = await api.patch(`/admin/business-admins/${id}/password`, {
    password,
  })
  return response.data?.data as { id: number }
}

export async function deleteBusinessAdmin(id: number | string) {
  const response = await api.delete(`/admin/business-admins/${id}`)
  return response.data?.data as { id: number; name: string; email: string }
}
