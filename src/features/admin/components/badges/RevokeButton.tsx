'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { revokeBadge } from '@/features/admin/actions/badges.actions'

export function RevokeButton({ grantId }: { grantId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, pending])

  const handleConfirm = () => {
    setError(null)
    startTransition(async () => {
      const res = await revokeBadge({ grantId, reason: reason.trim() || null })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setOpen(false)
      setReason('')
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
      >
        Revocar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) setOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-neutral-900">
            <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Revocar insignia
              </h2>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </header>
            <div className="space-y-3 p-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                ¿Seguro que quieres revocar esta asignación? El usuario dejará de mostrar la insignia.
              </p>
              <div>
                <label htmlFor="revoke-reason" className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Motivo (opcional)
                </label>
                <textarea
                  id="revoke-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="Ej. Asignación duplicada, ya no cumple los requisitos…"
                  className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="rounded-md bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {pending ? 'Revocando…' : 'Revocar'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
