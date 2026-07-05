'use server'

import {
  mapOfferingRow,
  OFFERING_COLUMNS,
  type OfferingRow,
  type ServiceOffering,
} from '../server/offerings.server'
import type { ServiceActionResult } from './service-action.helpers'
import { requireSession, revalidateService } from './service-action.session'

/**
 * Server Actions de los sub-servicios ("Servicios") de un servicio profesional.
 * Contrato de errores: los fallos esperados se DEVUELVEN como `{ ok:false, error }`
 * (Next.js redacta los mensajes de errores lanzados en producción). RLS ya
 * restringe las escrituras al dueño; aquí se re-verifica la propiedad con un
 * select barato para dar un error claro en español (defensa en profundidad).
 */

/** Input de creación/edición de un sub-servicio. */
export interface OfferingInput {
  title: string
  description?: string | null
  priceFrom?: number | null
}

type ServerClient = Awaited<ReturnType<typeof requireSession>>['client']

type ValidatedOffering = { title: string; description: string | null; priceFrom: number | null }

function validateOfferingInput(
  input: OfferingInput,
): { ok: true; value: ValidatedOffering } | { ok: false; error: string } {
  const title = (input.title ?? '').trim()
  if (title.length < 2 || title.length > 120) {
    return { ok: false, error: 'El título debe tener entre 2 y 120 caracteres.' }
  }
  const description = input.description?.trim() || null
  if (description && description.length > 600) {
    return { ok: false, error: 'La descripción no puede superar los 600 caracteres.' }
  }
  let priceFrom: number | null = null
  if (input.priceFrom !== null && input.priceFrom !== undefined) {
    const parsed = Number(input.priceFrom)
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, error: 'El precio "Desde" debe ser un número mayor o igual a 0.' }
    }
    priceFrom = parsed
  }
  return { ok: true, value: { title, description, priceFrom } }
}

/** Verifica que el servicio exista y pertenezca a la sesión; devuelve su slug. */
async function getOwnedService(
  client: ServerClient,
  userId: string,
  serviceId: string,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const { data, error } = await client
    .from('professional_services')
    .select('user_id, slug')
    .eq('id', serviceId)
    .maybeSingle()
  if (error) {
    console.error('[professional-services] getOwnedService read failed:', error.message)
    return { ok: false, error: 'No se pudo verificar el servicio. Intenta de nuevo.' }
  }
  if (!data) return { ok: false, error: 'El servicio no existe o ya no está disponible.' }
  if (data.user_id !== userId) {
    return { ok: false, error: 'Solo el dueño del servicio puede gestionar sus servicios.' }
  }
  return { ok: true, slug: data.slug as string }
}

/** Localiza un sub-servicio y verifica la propiedad del servicio padre. */
async function getOwnedOffering(
  client: ServerClient,
  userId: string,
  offeringId: string,
): Promise<{ ok: true; serviceId: string; slug: string } | { ok: false; error: string }> {
  const { data, error } = await client
    .from('professional_service_offerings')
    .select('id, service_id')
    .eq('id', offeringId)
    .maybeSingle()
  if (error) {
    console.error('[professional-services] getOwnedOffering read failed:', error.message)
    return { ok: false, error: 'No se pudo verificar el servicio. Intenta de nuevo.' }
  }
  if (!data) return { ok: false, error: 'Este servicio ya no existe o fue eliminado.' }
  const owned = await getOwnedService(client, userId, data.service_id as string)
  if (!owned.ok) return owned
  return { ok: true, serviceId: data.service_id as string, slug: owned.slug }
}

function toActionError(scope: string, err: unknown, fallback: string): { ok: false; error: string } {
  console.error(`[professional-services] ${scope} failed:`, err)
  return { ok: false, error: err instanceof Error && err.message ? err.message : fallback }
}

export async function addOfferingAction(
  serviceId: string,
  input: OfferingInput,
): Promise<ServiceActionResult<ServiceOffering>> {
  try {
    const { userId, client } = await requireSession()
    const validated = validateOfferingInput(input)
    if (!validated.ok) return validated
    const owned = await getOwnedService(client, userId, serviceId)
    if (!owned.ok) return owned

    // Siguiente posición al final de la lista.
    const { data: last } = await client
      .from('professional_service_offerings')
      .select('position')
      .eq('service_id', serviceId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()
    const position = ((last as { position: number } | null)?.position ?? -1) + 1

    const { data, error } = await client
      .from('professional_service_offerings')
      .insert({
        service_id: serviceId,
        title: validated.value.title,
        description: validated.value.description,
        price_from: validated.value.priceFrom,
        position,
      })
      .select(OFFERING_COLUMNS)
      .maybeSingle()
    if (error || !data) {
      console.error('[professional-services] addOfferingAction insert failed:', error?.message)
      return { ok: false, error: 'No se pudo agregar el servicio. Intenta de nuevo.' }
    }
    revalidateService(owned.slug)
    return { ok: true, data: mapOfferingRow(data as OfferingRow) }
  } catch (err) {
    return toActionError('addOfferingAction', err, 'No se pudo agregar el servicio. Intenta de nuevo.')
  }
}

export async function updateOfferingAction(
  id: string,
  input: OfferingInput,
): Promise<ServiceActionResult<ServiceOffering>> {
  try {
    const { userId, client } = await requireSession()
    const validated = validateOfferingInput(input)
    if (!validated.ok) return validated
    const owned = await getOwnedOffering(client, userId, id)
    if (!owned.ok) return owned

    const { data, error } = await client
      .from('professional_service_offerings')
      .update({
        title: validated.value.title,
        description: validated.value.description,
        price_from: validated.value.priceFrom,
      })
      .eq('id', id)
      .select(OFFERING_COLUMNS)
      .maybeSingle()
    if (error || !data) {
      console.error('[professional-services] updateOfferingAction update failed:', error?.message)
      return { ok: false, error: 'No se pudo actualizar el servicio. Intenta de nuevo.' }
    }
    revalidateService(owned.slug)
    return { ok: true, data: mapOfferingRow(data as OfferingRow) }
  } catch (err) {
    return toActionError('updateOfferingAction', err, 'No se pudo actualizar el servicio. Intenta de nuevo.')
  }
}

export async function deleteOfferingAction(id: string): Promise<ServiceActionResult<null>> {
  try {
    const { userId, client } = await requireSession()
    const owned = await getOwnedOffering(client, userId, id)
    if (!owned.ok) return owned

    const { error } = await client.from('professional_service_offerings').delete().eq('id', id)
    if (error) {
      console.error('[professional-services] deleteOfferingAction delete failed:', error.message)
      return { ok: false, error: 'No se pudo eliminar el servicio. Intenta de nuevo.' }
    }
    revalidateService(owned.slug)
    return { ok: true, data: null }
  } catch (err) {
    return toActionError('deleteOfferingAction', err, 'No se pudo eliminar el servicio. Intenta de nuevo.')
  }
}
