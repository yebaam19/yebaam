'use server'

import { requireSession } from './service-action.session'

/** Mismo contrato de retorno que el resto de acciones del feature. */
export type ServiceReportResult = { ok: true } | { ok: false; error: string }

export const REPORT_REASONS = ['fraude', 'suplantacion', 'contenido_inapropiado', 'otro'] as const
export type ServiceReportReason = (typeof REPORT_REASONS)[number]

/**
 * Registra un reporte sobre un servicio profesional (Art. 9/11/18 del Manual:
 * vía de denuncia con revisión < 24h). Un usuario solo puede tener un reporte
 * PENDING por servicio (índice único parcial + verificación previa).
 */
export async function reportServiceAction(
  serviceId: string,
  input: { reason: ServiceReportReason; details?: string },
): Promise<ServiceReportResult> {
  try {
    const { userId, client } = await requireSession()

    if (!REPORT_REASONS.includes(input.reason)) {
      return { ok: false, error: 'Selecciona un motivo válido.' }
    }
    const details = input.details?.trim() || null
    if (details && details.length > 1000) {
      return { ok: false, error: 'Los detalles no pueden superar los 1000 caracteres.' }
    }

    const { data: existing } = await client
      .from('professional_service_reports')
      .select('id')
      .eq('service_id', serviceId)
      .eq('reporter_id', userId)
      .eq('status', 'PENDING')
      .maybeSingle()
    if (existing) {
      return { ok: false, error: 'Ya reportaste este servicio; tu reporte está pendiente de revisión.' }
    }

    const { error } = await client.from('professional_service_reports').insert({
      service_id: serviceId,
      reporter_id: userId,
      reason: input.reason,
      details,
    })
    if (error) {
      // 23505 = el índice único parcial atrapó un reporte PENDING duplicado.
      if (error.code === '23505') {
        return { ok: false, error: 'Ya reportaste este servicio; tu reporte está pendiente de revisión.' }
      }
      console.error('[professional-services] reportServiceAction insert failed:', error.message)
      return { ok: false, error: 'No se pudo enviar el reporte. Intenta de nuevo.' }
    }
    return { ok: true }
  } catch (err) {
    console.error('[professional-services] reportServiceAction failed:', err)
    return { ok: false, error: 'No se pudo enviar el reporte. Intenta de nuevo.' }
  }
}
