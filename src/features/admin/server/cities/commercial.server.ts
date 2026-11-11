import 'server-only'
import { cache } from 'react'
import { requireAdminWithUser } from '@/features/admin/actions/_shared'
import { SERVICE_CATEGORIES } from '@/features/professional-services/data/service-categories-taxonomy'
import type { CityCommercialRow, CommercialKind } from '../../lib/city-commercial'

export const listCityCommercial = cache(async (cityId: string, kind: CommercialKind, page: number) => {
  const { client } = await requireAdminWithUser()
  const safePage = Number.isFinite(page) ? Math.max(1, Math.min(10000, Math.floor(page))) : 1
  if (kind === 'businesses') {
    const [listed, categories] = await Promise.all([
      client.rpc('list_city_businesses', { p_city_id: cityId, p_admin: true, p_page: safePage }),
      client.from('business_categories').select('slug,name').order('name').limit(200),
    ])
    if (listed.error || categories.error) throw new Error('No se pudo cargar el directorio de negocios.')
    const result = listed.data as { items: CityCommercialRow[]; total: number }
    return { ...result, categories: (categories.data ?? []).map((c) => ({ id: c.slug as string, name: c.name as string })) }
  }
  const { data, error, count } = await client.from('professional_services')
    .select('id,slug,city_id,user_id,name,description,address,phone,category_id,visibility,status,admin_created_by,admin_draft,provider_declaration_accepted_at', { count: 'exact' })
    .eq('city_id', cityId).order('name').order('id').range((safePage - 1) * 24, safePage * 24 - 1)
  if (error) throw new Error('No se pudo cargar el directorio profesional.')
  return { items: (data ?? []).map((r) => ({ ...r, category: r.category_id ?? '' })) as CityCommercialRow[],
    total: count ?? 0, categories: SERVICE_CATEGORIES.map((c) => ({ id: c.id, name: c.name })) }
})
