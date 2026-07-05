import 'server-only'

import { cache } from 'react'

import { getServerClient } from '@/utils/supabase/server'

/**
 * Lecturas de los sub-servicios ("Servicios") de un servicio profesional.
 * RLS: SELECT público cuando el servicio padre es PUBLIC+ACTIVE (o dueño/admin),
 * así que la lista que ve cada visitante ya viene filtrada por Postgres.
 */

/** Sub-servicio publicado dentro de un servicio profesional (camelCase de dominio). */
export interface ServiceOffering {
  id: string
  serviceId: string
  title: string
  description: string | null
  priceFrom: number | null
  position: number
}

/** Fila snake_case tal como vive en `professional_service_offerings`. */
export interface OfferingRow {
  id: string
  service_id: string
  title: string
  description: string | null
  price_from: number | string | null
  position: number
}

export const OFFERING_COLUMNS = 'id, service_id, title, description, price_from, position'

export function mapOfferingRow(row: OfferingRow): ServiceOffering {
  return {
    id: row.id,
    serviceId: row.service_id,
    title: row.title,
    description: row.description,
    // PostgREST serializa `numeric` como número JSON, pero coercionamos por si
    // llega como string (valores fuera del rango de double precision).
    priceFrom: row.price_from === null ? null : Number(row.price_from),
    position: row.position,
  }
}

export const listServiceOfferings = cache(async (serviceId: string): Promise<ServiceOffering[]> => {
  const client = await getServerClient()
  const { data, error } = await client
    .from('professional_service_offerings')
    .select(OFFERING_COLUMNS)
    .eq('service_id', serviceId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) {
    console.error('[professional-services] listServiceOfferings read failed:', error.message)
    return []
  }
  return ((data ?? []) as OfferingRow[]).map(mapOfferingRow)
})
