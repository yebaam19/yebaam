'use client'

import Link from 'next/link'
import { useState } from 'react'

import { FlagIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { useAuth } from '@/features/auth'
import {
  reportServiceAction,
  type ServiceReportReason,
} from '../actions/reports.actions'

const REASON_LABELS: Record<ServiceReportReason, string> = {
  fraude: 'Fraude o estafa',
  suplantacion: 'Suplantación de identidad',
  contenido_inapropiado: 'Contenido inapropiado',
  otro: 'Otro motivo',
}

interface ReportServiceDialogProps {
  serviceId: string
  serviceName: string
}

/**
 * Botón + diálogo "Reportar servicio" (Art. 9/11/18 del Manual de Convivencia:
 * vía de denuncia con revisión en menos de 24 horas).
 */
export function ReportServiceDialog({ serviceId, serviceName }: ReportServiceDialogProps) {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ServiceReportReason>('fraude')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const close = () => {
    setOpen(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await reportServiceAction(serviceId, { reason, details: details.trim() || undefined })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
        aria-label="Reportar servicio"
        title="Reportar servicio"
      >
        <FlagIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Reportar ${serviceName}`}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Reportar servicio</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {sent ? (
              <div className="space-y-4">
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  Reporte enviado. Será revisado en menos de 24 horas.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
                >
                  Entendido
                </button>
              </div>
            ) : !isAuthenticated ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <Link href="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
                  Inicia sesión
                </Link>{' '}
                para reportar este servicio.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="report-reason"
                    className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Motivo
                  </label>
                  <select
                    id="report-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value as ServiceReportReason)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    {Object.entries(REASON_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="report-details"
                    className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Detalles (opcional)
                  </label>
                  <textarea
                    id="report-details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Describe qué observaste…"
                    className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {busy ? 'Enviando…' : 'Enviar reporte'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
