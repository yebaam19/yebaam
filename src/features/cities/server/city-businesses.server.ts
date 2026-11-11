import 'server-only'
import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from './cf'
import type { BusinessBasic, BusinessCategory } from '../interfaces/directory.interfaces'

export interface CityBusinessListing {
  id: string; slug: string; name: string; description: string
  logoUrl?: string; coverUrl?: string; adImageUrl?: string
  address?: string; website?: string; phone?: string; averageRating: number | null
}
interface BusinessRow {
  id: string; slug: string; name: string; category: string; description: string | null
  address: string | null; phone: string | null; profile_cf_image_id: string | null
  review_count: number; avg_rating: number
}

/** Canonical Negocios rows, filtered before pagination in Postgres. */
export async function fetchCityBusinessPage(client: SupabaseClient, cityId: string, page = 1, category?: string) {
  const { data, error } = await client.rpc('list_city_businesses', {
    p_city_id: cityId, p_admin: false, p_page: Math.max(1, Math.floor(page || 1)), p_category: category ?? null,
  })
  if (error) throw new Error('No se pudieron cargar los negocios de la ciudad.')
  return data as { items: BusinessRow[]; total: number }
}
export const getBusinessDirectoryCategories = cache(async (): Promise<BusinessCategory[]> => {
  const client = await getServerClient()
  const { data, error } = await client.from('business_categories').select('slug,name').order('name').limit(200)
  if (error) throw new Error('No se pudieron cargar las categorías de negocios.')
  return (data ?? []).map((r) => ({ id: r.slug, name: r.name, createdAt: '' }))
})
export const getCityBusinessPage = cache(async (cityId: string, page = 1) => {
  const client = await getServerClient()
  const [result, categories] = await Promise.all([fetchCityBusinessPage(client, cityId, page), getBusinessDirectoryCategories()])
  return { total: result.total, items: result.items.map((r): BusinessBasic => ({
    id: r.id, slug: r.slug, name: r.name, adImageUrl: cfImageUrl(r.profile_cf_image_id),
    category: { id: r.category, name: categories.find((c) => c.id === r.category)?.name ?? r.category },
    _count: { reviews: r.review_count, media: 0 },
  })) }
})
export const getCityBusinesses = cache(async (cityId: string) => (await getCityBusinessPage(cityId)).items)
export const getCityBusinessCategoryPage = cache(async (cityId: string, category: string, page = 1) => {
  const client = await getServerClient()
  const result = await fetchCityBusinessPage(client, cityId, page, category)
  return { total: result.total, items: result.items.map((r): CityBusinessListing => ({
    id: r.id, slug: r.slug, name: r.name, description: r.description ?? '',
    logoUrl: cfImageUrl(r.profile_cf_image_id), address: r.address ?? undefined,
    phone: r.phone ?? undefined, averageRating: Number(r.avg_rating),
  })) }
})
export const getCityBusinessesByCategory = cache(async (cityId: string, category: string) =>
  (await getCityBusinessCategoryPage(cityId, category)).items)
