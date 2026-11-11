import 'server-only'
import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { isDirectoryCategory, isUuid, type DirectoryEntry } from '../directory/types'

export const DIRECTORY_SELECT = 'id, city_id, category_id, name, description, address, phone, website, cover_cf_image_id, status'

export const getDirectoryCategories = cache(async () => {
  const client = await getServerClient()
  const { data, error } = await client.from('business_categories').select('id, name, slug').order('name').limit(100)
  if (error) throw new Error('Unable to load directory categories')
  return ((data ?? []) as { id: string; name: string; slug: string }[]).filter((c) => isDirectoryCategory(c.slug))
})

export const getDirectoryEntries = cache(async (cityId: string, category: string, page = 1, admin = false) => {
  if (admin) await requirePlatformAdmin()
  const categories = await getDirectoryCategories()
  const categoryId = categories.find((c) => c.slug === category)?.id
  const pageSize = 24
  const safePage = Number.isFinite(page) ? Math.min(100000, Math.max(1, Math.floor(page))) : 1
  if (!isUuid(cityId) || !categoryId) return { items: [] as DirectoryEntry[], total: 0, page: safePage, pageSize }
  const client = await getServerClient()
  let query = client.from('city_directory_entries').select(DIRECTORY_SELECT, { count: 'exact' })
    .eq('city_id', cityId).eq('category_id', categoryId)
  if (!admin) query = query.eq('status', 'published')
  const { data, count, error } = await query.order('id').range((safePage - 1) * pageSize, safePage * pageSize - 1)
  if (error) throw new Error('Unable to load directory entries')
  return { items: (data ?? []) as DirectoryEntry[], total: count ?? 0, page: safePage, pageSize }
})
