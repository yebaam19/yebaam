'use server'

import { revalidatePath } from 'next/cache'
import { getServiceClient } from '@/utils/supabase/server'
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import type { ActionResult } from './_shared'

/**
 * Platform-admin lifecycle actions for `professional_services`:
 * suspend (status → 'SUSPENDED') and reinstate (status → 'ACTIVE').
 *
 * RLS (`psvc_update_owner`) does grant platform admins an UPDATE path, but we
 * follow the repo's admin-action convention (see work-verification.actions.ts)
 * and mutate with the service-role client after `requirePlatformAdmin()` gates
 * the caller — the gate redirects non-admins before any mutation runs.
 */

type ServiceStatusResult = ActionResult<{ id: string; status: 'ACTIVE' | 'SUSPENDED' }>

/** Shared mutator behind both actions: gate → update status → revalidate. */
async function setServiceStatus(
  serviceId: string,
  status: 'ACTIVE' | 'SUSPENDED',
): Promise<{ result: ServiceStatusResult; adminId: string | null }> {
  await requirePlatformAdmin()
  const adminId = (await getCachedAuthUser())?.id ?? null

  if (!serviceId) return { result: { ok: false, error: 'Falta el identificador del servicio.' }, adminId }

  const service = getServiceClient()
  // `updated_at` lo toca el trigger tg_professional_services_updated_at.
  const { data, error } = await service
    .from('professional_services')
    .update({ status })
    .eq('id', serviceId)
    .select('id, slug, status')
    .maybeSingle()

  if (error) return { result: { ok: false, error: error.message }, adminId }
  if (!data) return { result: { ok: false, error: 'Servicio no encontrado.' }, adminId }

  const row = data as { id: string; slug: string; status: 'ACTIVE' | 'SUSPENDED' }

  // Public directory + public detail page (both render status-gated data),
  // plus the admin supervision table.
  revalidatePath('/professional-services')
  revalidatePath(`/professional-services/${row.slug}`)
  revalidatePath('/admin/professional-services')

  return { result: { ok: true, data: { id: row.id, status: row.status } }, adminId }
}

/**
 * Suspende un servicio profesional (status → 'SUSPENDED'). El servicio
 * desaparece del directorio público y de su página de detalle hasta que un
 * admin lo reactive.
 */
export async function suspendServiceAction(
  serviceId: string,
  reason: string,
): Promise<ServiceStatusResult> {
  // Gate ANTES de validar entradas: un no-admin siempre debe salir por el
  // redirect, nunca por un error de validación. (Cacheado; setServiceStatus
  // vuelve a comprobarlo sin coste.)
  await requirePlatformAdmin()

  const trimmedReason = reason?.trim() ?? ''
  if (!trimmedReason) return { ok: false, error: 'Debes indicar el motivo de la suspensión.' }
  if (trimmedReason.length > 500) return { ok: false, error: 'El motivo no puede superar los 500 caracteres.' }

  const { result, adminId } = await setServiceStatus(serviceId, 'SUSPENDED')

  // TODO(audit): persist { serviceId, adminId, reason } to a dedicated
  // moderation-audit table once the staged migration lands. Until then the
  // reason only reaches the server logs via this warn.
  if (result.ok) {
    console.warn('[admin] service suspended', { serviceId, adminId, reason: trimmedReason })
  }

  return result
}

/** Reactiva un servicio profesional suspendido (status → 'ACTIVE'). */
export async function reinstateServiceAction(serviceId: string): Promise<ServiceStatusResult> {
  const { result, adminId } = await setServiceStatus(serviceId, 'ACTIVE')

  // Same audit-table TODO as suspendServiceAction — log-only for now.
  if (result.ok) {
    console.warn('[admin] service reinstated', { serviceId, adminId })
  }

  return result
}
