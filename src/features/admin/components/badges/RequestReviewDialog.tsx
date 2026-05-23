'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  approveBadgeRequest,
  rejectBadgeRequest,
} from '@/features/admin/actions/badges.actions'
import { getBadgeRequestSupportingUrls } from '@/features/admin/actions/badges-signed-urls.actions'
import type { BadgeRequestRow } from '@/features/admin/types/badges.types'

interface Props {
  request: BadgeRequestRow
  open: boolean
  onClose: () => void
}

export function RequestReviewDialog({ request, open, onClose }: Props) {
  const router = useRouter()
  const [urls, setUrls] = useState<string[]>([])
  const [loadingUrls, setLoadingUrls] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    if (request.supportingCfImageIds.length === 0) {
      setUrls([])
      return
    }
    let cancelled = false
    setLoadingUrls(true)
    ;(async () => {
      const res = await getBadgeRequestSupportingUrls(request.id)
      if (cancelled) return
      setUrls(res.ok ? res.data : [])
      setLoadingUrls(false)
    })()
    return () => {
      cancelled = true
    }
  }, [open, request.id, request.supportingCfImageIds.length])

  if (!open) return null

  const handleApprove = () => {
    setError(null)
    startTransition(async () => {
      const res = await approveBadgeRequest({ requestId: request.id, reason: reason.trim() || null })
      if (!res.ok) {
        setError(res.error)
        return
      }
      onClose()
      router.refresh()
    })
  }
  const handleReject = () => {
    setError(null)
    startTransition(async () => {
      const res = await rejectBadgeRequest({ requestId: request.id, reason: reason.trim() || null })
      if (!res.ok) {
        setError(res.error)
        return
      }
      onClose()
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-neutral-900">
        <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-lg font-bold">Revisar solicitud</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
            ✕
          </button>
        </header>
        <div className="space-y-4 p-4">
          <div className="rounded-md bg-neutral-50 p-3 text-sm dark:bg-neutral-950/50">
            <p>
              <strong>{request.displayName ?? request.username}</strong>{' '}
              {request.username && <span className="text-neutral-500">@{request.username}</span>}
            </p>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              solicita la insignia <strong>{request.badgeName}</strong>
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Enviada {new Date(request.createdAt).toLocaleString('es-ES')}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Motivo</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {request.reason || <span className="text-neutral-400">(sin texto)</span>}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Documentos de soporte
            </h3>
            {request.supportingCfImageIds.length === 0 ? (
              <p className="mt-1 text-sm text-neutral-400">Sin documentos.</p>
            ) : loadingUrls ? (
              <p className="mt-1 text-sm text-neutral-500">Cargando…</p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {urls.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="block">
                    <Image
                      src={u}
                      alt={`Soporte ${i + 1}`}
                      width={200}
                      height={200}
                      className="aspect-square w-full rounded-md object-cover"
                      unoptimized
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Comentario (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={handleReject}
            disabled={pending}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={pending}
            className="rounded-md bg-primary-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
          >
            {pending ? 'Procesando…' : 'Aprobar'}
          </button>
        </footer>
      </div>
    </div>
  )
}
