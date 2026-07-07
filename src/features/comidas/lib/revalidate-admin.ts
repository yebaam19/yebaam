import { revalidatePath } from 'next/cache'

/**
 * Admin sections whose Server Components read mutable business-scoped data.
 * Keep this list in sync with the route segments under
 * src/app/(comidas)/negocios/admin/[businessId]/*.
 */
export type BusinessAdminSection =
  | 'productos'
  | 'promociones'
  | 'media'
  | 'publicaciones'
  | 'administradores'
  | 'actividad'
  | 'analytics'
  | 'settings'

/**
 * Single source of truth for invalidating the admin route tree of one
 * business after a mutation. Using the concrete businessId (not the
 * '[businessId]' template) scopes the cache invalidation to that one
 * business only — other businesses' admin pages stay cached.
 *
 * Every Server Action that mutates business-scoped data (products,
 * promotions, media, etc.) must call this in addition to whatever public
 * page revalidation it already performs, otherwise the admin UI shows
 * stale data until a manual refresh.
 */
export function revalidateBusinessAdmin(businessId: string, section: BusinessAdminSection) {
  revalidatePath(`/negocios/admin/${businessId}/${section}`)
}
