'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { reviewEmprendimiento } from '@/features/admin/actions/city-emprendimientos.actions'

interface Props {
  rowId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

/**
 * Approve / reject / reset controls for one emprendimiento row. Approving is
 * one click; rejecting opens a small reason dialog (the reason is shown to
 * the entrepreneur on their pending banner), with quick-pick chips for the
 * common cases.
 */
export function EmprendimientoRowActions({ rowId, status }: Props) {
  const t = useTranslations('admin.ciudades')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState('')

  const decide = (decision: 'APPROVED' | 'REJECTED' | 'PENDING', rejectionReason?: string) => {
    setError(false)
    startTransition(async () => {
      const res = await reviewEmprendimiento({ id: rowId, decision, rejectionReason })
      if (res.ok) {
        setDialogOpen(false)
        setReason('')
        router.refresh()
      } else {
        setError(true)
      }
    })
  }

  const quickReasons = [
    t('emprendimientosRejectQuick1'),
    t('emprendimientosRejectQuick2'),
    t('emprendimientosRejectQuick3'),
  ]

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1">
        {status !== 'APPROVED' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => decide('APPROVED')}
            className="rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {t('emprendimientosApprove')}
          </button>
        )}
        {status !== 'REJECTED' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setDialogOpen(true)}
            className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {t('emprendimientosReject')}
          </button>
        )}
        {status !== 'PENDING' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => decide('PENDING')}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {t('emprendimientosResetPending')}
          </button>
        )}
      </div>
      {error && (
        <span className="text-[11px] text-red-600 dark:text-red-400">{t('actionError')}</span>
      )}

      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('emprendimientosRejectDialogTitle')}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-neutral-900">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {t('emprendimientosRejectDialogTitle')}
            </h3>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t('emprendimientosRejectReasonLabel')}
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('emprendimientosRejectPlaceholder')}
                rows={3}
                maxLength={500}
                className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-primary-400 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickReasons.map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setReason(quick)}
                  className="rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  {quick}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => setDialogOpen(false)}
                className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t('emprendimientosCancel')}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => decide('REJECTED', reason)}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {t('emprendimientosRejectConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
