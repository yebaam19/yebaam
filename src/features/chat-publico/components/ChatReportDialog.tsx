'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { reportCommunityChatMessage } from '../actions/community-chat.actions'

export default function ChatReportDialog({ messageId, onClose }: { messageId: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await reportCommunityChatMessage(messageId, reason)
      if (result.ok) setSubmitted(true)
      else setError(result.error)
    })
  }

  return (
    <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onClose() }} aria-labelledby="chat-report-title"
      className="m-auto w-[min(28rem,calc(100vw-1.5rem))] rounded-2xl border border-primary-100 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-neutral-950/50 dark:border-primary-900 dark:bg-neutral-900 dark:text-neutral-100">
      <div className="border-b border-primary-100 px-4 py-3 dark:border-primary-900/50">
        <h2 id="chat-report-title" className="text-base font-semibold text-primary-900 dark:text-primary-100">Reportar mensaje</h2>
        <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">El equipo de la comunidad revisará tu reporte.</p>
      </div>
      {submitted ? (
        <div className="space-y-3 px-4 py-4">
          <p role="status" className="text-sm text-primary-800 dark:text-primary-200">Reporte recibido. Gracias por avisarnos.</p>
          <button type="button" onClick={onClose} className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900">Cerrar</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3 px-4 py-4">
          <label htmlFor="chat-report-reason" className="block text-sm font-medium">¿Qué ocurrió?</label>
          <textarea id="chat-report-reason" value={reason} onChange={(event) => setReason(event.target.value)}
            minLength={10} maxLength={500} rows={4} required autoFocus
            placeholder="Describe el motivo del reporte"
            className="w-full resize-y rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 dark:border-primary-800 dark:bg-neutral-800" />
          <p className="text-xs text-neutral-500">{reason.length}/500 caracteres · mínimo 10</p>
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-800 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-200">Cancelar</button>
            <button type="submit" disabled={isPending || reason.trim().length < 10}
              className="rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-50">
              {isPending ? 'Enviando…' : 'Enviar reporte'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
