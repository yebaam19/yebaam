import { getBusinessById } from '../businesses/api'

export type MenuProduct = {
  id: number
  name: string
  slug?: string
  shortDescription?: string | null
  description?: string | null
  ingredients?: string | null
  price: number | string
  currency?: string
  imageUrl?: string | null
  isFeatured?: boolean
  isActive?: boolean
  sortOrder?: number
}

export type MenuCategory = {
  id: number
  name: string
  description?: string | null
  sortOrder?: number
  products: MenuProduct[]
}

export type BusinessMenu = {
  id: number
  name: string
  category: string
  description?: string | null
  city?: string | null
  address?: string | null
  whatsapp?: string | null
  phone?: string | null
  ratingAverage?: number
  reviewsCount?: number
  menus?: Array<{
    id: number
    name: string
    description?: string | null
    categories?: MenuCategory[]
  }>
}

export async function getBusinessMenuById(id: number | string) {
  return getBusinessById<BusinessMenu>(id)
}

export function formatMenuPrice(value: number | string, currency = 'COP') {
  const numericValue = typeof value === 'string' ? Number(value) : value

  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(numericValue)
}
