import { revalidatePath } from 'next/cache'

import { getServerClient } from '@/utils/supabase/server'
import { findSubcategoryById } from '../data/service-categories-taxonomy'
import { professionalServicePath } from '../constants/routes'
import { slugify } from './service-action.helpers'

type ServerClient = Awaited<ReturnType<typeof getServerClient>>

export async function requireSession(): Promise<{ userId: string; client: ServerClient }> {
  const client = await getServerClient()
  const { data } = await client.auth.getUser()
  if (!data.user) throw new Error('Inicia sesión para continuar.')
  return { userId: data.user.id, client }
}

export async function uniqueServiceSlug(client: ServerClient, name: string): Promise<string> {
  const base = slugify(name)
  let candidate = base
  for (let i = 0; i < 25; i++) {
    const { data } = await client.from('professional_services').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${i + 2}`
  }
  return `${base}-${Math.random().toString(36).slice(2, 8)}`
}

interface SubcategoryInsertRow {
  service_id: string
  subcategory_id: string
  subcategory_name: string
  category_id: string | null
}

function buildSubcategoryRows(
  serviceId: string,
  subcategoryIds: string[] | undefined,
  categoryId: string | undefined,
): SubcategoryInsertRow[] {
  return (subcategoryIds ?? []).filter(Boolean).map((subId) => {
    const sub = findSubcategoryById(subId)
    return {
      service_id: serviceId,
      subcategory_id: subId,
      subcategory_name: sub?.name ?? subId,
      category_id: sub?.parentId ?? categoryId ?? null,
    }
  })
}

/**
 * Inserta subcategorías comprobando el error del insert. Lanza con mensaje en
 * español — las actions CRUD lo atrapan y lo devuelven como `{ ok:false }`
 * (nunca cruza la frontera server/cliente sin envolver).
 */
export async function insertSubcategories(
  client: ServerClient,
  serviceId: string,
  subcategoryIds: string[] | undefined,
  categoryId: string | undefined,
): Promise<void> {
  const rows = buildSubcategoryRows(serviceId, subcategoryIds, categoryId)
  if (rows.length === 0) return
  const { error } = await client.from('professional_service_subcategories').insert(rows)
  if (error) throw new Error(`No se pudieron guardar las subcategorías del servicio: ${error.message}`)
}

/**
 * Reemplaza el set de subcategorías con un diff insertar-primero /
 * borrar-después: las filas nuevas se validan y escriben ANTES de tocar las
 * existentes (hay UNIQUE(service_id, subcategory_id), así que insertar solo
 * las que faltan no colisiona). Si el insert falla, la categorización anterior
 * queda intacta — un fallo nunca deja el servicio sin categorizar.
 */
export async function replaceSubcategories(
  client: ServerClient,
  serviceId: string,
  subcategoryIds: string[] | undefined,
  categoryId: string | undefined,
): Promise<void> {
  const rows = buildSubcategoryRows(serviceId, subcategoryIds, categoryId)

  const { data: existing, error: readError } = await client
    .from('professional_service_subcategories')
    .select('subcategory_id')
    .eq('service_id', serviceId)
  if (readError) {
    throw new Error(`No se pudieron leer las subcategorías actuales: ${readError.message}`)
  }

  const existingIds = new Set(
    ((existing ?? []) as Array<{ subcategory_id: string }>).map((r) => r.subcategory_id),
  )
  const keepIds = new Set(rows.map((r) => r.subcategory_id))
  const toInsert = rows.filter((r) => !existingIds.has(r.subcategory_id))
  const toDelete = [...existingIds].filter((id) => !keepIds.has(id))

  if (toInsert.length > 0) {
    const { error } = await client.from('professional_service_subcategories').insert(toInsert)
    if (error) throw new Error(`No se pudieron guardar las nuevas subcategorías: ${error.message}`)
  }
  if (toDelete.length > 0) {
    const { error } = await client
      .from('professional_service_subcategories')
      .delete()
      .eq('service_id', serviceId)
      .in('subcategory_id', toDelete)
    if (error) throw new Error(`No se pudieron quitar las subcategorías anteriores: ${error.message}`)
  }
}

export function revalidateService(slug?: string) {
  revalidatePath('/professional-services')
  if (slug) revalidatePath(professionalServicePath(slug))
}
