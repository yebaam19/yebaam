import 'server-only'

import { getServiceClient } from '@/utils/supabase/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { fetchProfiles, sanitizeToken } from '@/features/professional-services/server/_shared'
import { findCategoryById } from '@/features/professional-services/data/service-categories-taxonomy'
import { getUserDisplayName } from '@/lib/user-helpers'

export type AdminServiceStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED'

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
  status: AdminServiceStatus
}

interface AdminQueryRow {
  id: string
  slug: string
  name: string
  status: string
  category_id: string | null
  available_for_hire: boolean
  average_rating: number | null
  review_count: number
  user_id: string
  city: { name: string } | null
}

/**
 * Listado de servicios profesionales para la vista de administración
 * (supervisión + suspender/reactivar). A diferencia del listado público
 * (`listServices`), NO filtra por `status = 'ACTIVE'`: el admin necesita ver
 * los servicios suspendidos para poder reactivarlos. Lee con el service client
 * (mismo canal privilegiado que las acciones admin), tras el gate
 * `requirePlatformAdmin()` — la página también lo ejecuta; está cacheado por
 * request.
 */
export async function listAdminServices(search = ''): Promise<AdminServiceRow[]> {
  await requirePlatformAdmin()

  const service = getServiceClient()
  let q = service
    .from('professional_services')
    .select(
      'id, slug, name, status, category_id, available_for_hire, average_rating, review_count, user_id, city:cities(name)',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (search) {
    const token = sanitizeToken(search)
    if (token) q = q.or(`name.ilike.%${token}%,description.ilike.%${token}%,tags.cs.{${token.toLowerCase()}}`)
  }

  const { data, error } = await q
  if (error) {
    console.error('[admin] listAdminServices read failed:', error.message)
    return []
  }

  const rows = (data ?? []) as unknown as AdminQueryRow[]
  const owners = await fetchProfiles(service, rows.map((r) => r.user_id))

  return rows.map((r) => {
    const owner = owners.get(r.user_id)
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      ownerName: getUserDisplayName(
        owner
          ? { firstName: owner.first_name, lastName: owner.last_name, username: owner.username }
          : null,
      ),
      ownerUsername: owner?.username ?? '',
      categoryName: r.category_id ? (findCategoryById(r.category_id)?.name ?? null) : null,
      cityName: r.city?.name ?? null,
      // `average_rating` defaults to 0 en BD; sin reseñas la tabla debe mostrar
      // "Sin reseñas" en vez de "0.0".
      averageRating: (r.review_count ?? 0) > 0 ? (r.average_rating ?? null) : null,
      reviewsCount: r.review_count ?? 0,
      availableForHire: r.available_for_hire,
      status: (r.status as AdminServiceStatus) ?? 'ACTIVE',
    }
  })
}
