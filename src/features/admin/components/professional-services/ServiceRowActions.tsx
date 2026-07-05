'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  reinstateServiceAction,
  suspendServiceAction,
} from '@/features/admin/actions/professional-services.actions'
import type { AdminServiceStatus } from '@/features/admin/server/professional-services.server'

interface Props {
  serviceId: string
  serviceName: string
  status: AdminServiceStatus
}

/**
 * Suspender / Reactivar para una fila de servicio profesional. Suspender abre
 * un pequeño diálogo que exige el motivo (queda en los logs del servidor hasta
 * que exista la tabla de auditoría); reactivar es un clic directo.
 */
export function ServiceRowActions({ serviceId, serviceName, status }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState('')

  const suspend = () => {
    setError(null)
    startTransition(async () => {
      const res = await suspendServiceAction(serviceId, reason)
      if (res.ok) {
        setDialogOpen(false)
        setReason('')
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  const reinstate = () => {
    setError(null)
    startTransition(async () => {
      const res = await reinstateServiceAction(serviceId)
      if (res.ok) router.refresh()
      else setError(res.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {status === 'SUSPENDED' ? (
        <button
          type="button"
          disabled={pending}
          onClick={reinstate}
          className="inline-flex items-center rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
        >
          {pending ? 'Reactivando…' : 'Reactivar'}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null)
            setDialogOpen(true)
          }}
          className="inline-flex items-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Suspender
        </button>
      )}
      {error && !dialogOpen && (
        <span className="max-w-48 text-right text-[11px] text-red-600 dark:text-red-400">{error}</span>
      )}

      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Suspender servicio"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-neutral-900">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Suspender «{serviceName}»
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              El servicio dejará de aparecer en el directorio público hasta que se reactive.
            </p>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Motivo de la suspensión
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej.: incumple las normas de la comunidad…"
                rows={3}
                maxLength={500}
                className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </label>
            {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setDialogOpen(false)
                  setError(null)
                }}
                className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending || reason.trim().length === 0}
                onClick={suspend}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {pending ? 'Suspendiendo…' : 'Suspender servicio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
