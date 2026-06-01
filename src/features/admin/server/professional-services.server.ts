import 'server-only'

import { professionalServiceService } from '@/features/professional-services/services/professional-service.service'

export interface AdminServiceRow {
  id: string
  name: string
  slug: string
  ownerName: string
  ownerUsername: string
  categoryName: string | null
  cityName: string | null
  averageRating: number | null
  reviewsCount: number
  availableForHire: boolean
}

/**
 * Listado de servicios profesionales para la vista de administración
 * (supervisión). Lee del servicio de servicios profesionales — hoy respaldado
 * por datos mock (`USE_MOCK`), así que es de solo lectura hasta que el backend
 * Supabase esté migrado. Devuelve filas planas listas para la tabla.
 */
export async function listAdminServices(search = ''): Promise<AdminServiceRow[]> {
  const res = await professionalServiceService.getServices({
    search: search || undefined,
    page: 1,
    limit: 100,
  })

  return res.services.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    ownerName: s.user ? [s.user.firstName, s.user.lastName].filter(Boolean).join(' ') || '—' : '—',
    ownerUsername: s.user?.username ?? '',
    categoryName: s.category?.name ?? null,
    cityName: s.city?.name ?? null,
    averageRating: s.averageRating ?? null,
    reviewsCount: s._count?.reviews ?? 0,
    availableForHire: s.availableForHire,
  }))
}
