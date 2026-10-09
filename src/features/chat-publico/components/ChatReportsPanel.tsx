'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { listCommunityChatReports, restoreCommunityChatMessage, reviewCommunityChatReport } from '../actions/community-chat.actions'
import type { CommunityChatReport } from '../types'

type Status = CommunityChatReport['status']
type Operation = 'hide' | 'dismiss' | 'restore'

export default function ChatReportsPanel({ communityId, onClose }: { communityId: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [status, setStatus] = useState<Status>('open')
  const [items, setItems] = useState<CommunityChatReport[]>([])
  const [cursor, setCursor] = useState<{ createdAt: string; id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const activeStatusRef = useRef(status)
  const [selection, setSelection] = useState<{ report: CommunityChatReport; operation: Operation } | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])

  useEffect(() => {
    let active = true
    void listCommunityChatReports(communityId, status).then((result) => {
      if (!active) return
      if (result.ok) { setItems(result.items); setCursor(result.nextCursor); setError(null) }
      else setError(result.error)
      setLoading(false)
    })
    return () => { active = false }
  }, [communityId, status])

  const switchStatus = (next: Status) => {
    if (next === status) return
    activeStatusRef.current = next
    setStatus(next)
    setLoading(true)
    setItems([])
    setCursor(null)
    setSelection(null)
  }

  const loadMore = async () => {
    if (!cursor || loadingMore) return
    const requestedStatus = status
    setLoadingMore(true)
    const result = await listCommunityChatReports(communityId, status, cursor)
    if (activeStatusRef.current === requestedStatus) {
      if (result.ok) {
        setItems((previous) => [...previous, ...result.items.filter((item) => !previous.some((row) => row.id === item.id))])
        setCursor(result.nextCursor)
      } else setError(result.error)
    }
    setLoadingMore(false)
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selection || pending) return
    setError(null)
    startTransition(async () => {
      const result = selection.operation === 'restore'
        ? await restoreCommunityChatMessage(selection.report.message_id, note)
        : await reviewCommunityChatReport(selection.report.id, selection.operation, note)
      if (!result.ok) { setError(result.error); return }
      setSelection(null)
      setNote('')
      const refreshed = await listCommunityChatReports(communityId, status)
      if (refreshed.ok) { setItems(refreshed.items); setCursor(refreshed.nextCursor) }
      else setError(refreshed.error)
    })
  }

  const select = (report: CommunityChatReport, operation: Operation) => {
    setSelection({ report, operation })
    setNote('')
    setError(null)
  }

  return (
    <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onClose() }} aria-labelledby="community-chat-reports-title"
      className="m-auto max-h-[min(85dvh,700px)] w-[min(38rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-primary-100 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-neutral-950/50 dark:border-primary-900 dark:bg-neutral-900 dark:text-neutral-100">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-primary-100 bg-white px-4 py-3 dark:border-primary-900 dark:bg-neutral-900">
        <div><h2 id="community-chat-reports-title" className="text-base font-semibold text-primary-900 dark:text-primary-100">Reportes del chat</h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Revisa el motivo antes de tomar una decisión.</p></div>
        <button type="button" onClick={onClose} className="rounded-lg border border-primary-200 px-2.5 py-1.5 text-xs font-medium text-primary-800 dark:border-primary-800 dark:text-primary-200">Cerrar</button>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-primary-100 px-4 py-2 dark:border-primary-900">
        {(['open','resolved','dismissed'] as const).map((value) => (
          <button key={value} type="button" onClick={() => switchStatus(value)} aria-pressed={status === value}
            className={status === value ? 'rounded-full bg-primary-800 px-3 py-1.5 text-xs font-semibold text-white' : 'rounded-full px-3 py-1.5 text-xs font-medium text-primary-800 hover:bg-primary-50 dark:text-primary-200'}>
            {value === 'open' ? 'Pendientes' : value === 'resolved' ? 'Resueltos' : 'Descartados'}
          </button>
        ))}
      </div>
      <div className="space-y-3 p-4">
        {loading && <p role="status" className="text-sm text-neutral-500">Cargando reportes…</p>}
        {!loading && items.length === 0 && <p className="rounded-xl bg-primary-50 px-3 py-4 text-sm text-primary-800 dark:bg-primary-950/30 dark:text-primary-200">No hay reportes en esta sección.</p>}
        {items.map((report) => (
          <article key={report.id} className="rounded-xl border border-primary-100 p-3 dark:border-primary-900/60">
            <p className="text-xs text-neutral-500">{new Date(report.created_at).toLocaleString()}</p>
            <p className="mt-1 text-sm font-medium text-primary-950 dark:text-primary-100">{report.reason}</p>
            <p className="mt-2 rounded-lg bg-primary-50 px-2.5 py-2 text-xs text-primary-900 dark:bg-primary-950/30 dark:text-primary-200">
              Mensaje: {report.message?.content ?? 'No disponible'}
            </p>
            {report.reviewer_note && <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">Decisión: {report.reviewer_note}</p>}
            {status === 'open' && <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => select(report, 'hide')} className="rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-semibold text-white">Retirar mensaje</button>
              <button type="button" onClick={() => select(report, 'dismiss')} className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-800 dark:border-primary-800 dark:text-primary-200">Descartar reporte</button>
            </div>}
            {status === 'resolved' && report.message?.moderation_hidden_at && <button type="button" onClick={() => select(report, 'restore')} className="mt-3 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-medium text-primary-800 dark:border-primary-800 dark:text-primary-200">Restaurar mensaje</button>}
          </article>
        ))}
        {cursor && <button type="button" onClick={() => void loadMore()} disabled={loadingMore}
          className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-800 disabled:opacity-50 dark:border-primary-800 dark:text-primary-200">
          {loadingMore ? 'Cargando…' : 'Cargar más reportes'}
        </button>}
        {selection && <form onSubmit={submit} className="rounded-xl border border-secondary-200 bg-secondary-50 p-3 dark:border-secondary-900/40 dark:bg-primary-950/30">
          <label htmlFor="chat-review-note" className="block text-xs font-semibold text-primary-900 dark:text-primary-100">Motivo para {selection.operation === 'hide' ? 'retirar' : selection.operation === 'restore' ? 'restaurar' : 'descartar'}</label>
          <textarea id="chat-review-note" value={note} onChange={(event) => setNote(event.target.value)} minLength={10} maxLength={500} rows={3} required
            className="mt-2 w-full resize-y rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 dark:border-primary-800 dark:bg-neutral-900" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="submit" disabled={pending || note.trim().length < 10} className="rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Confirmar</button>
            <button type="button" onClick={() => setSelection(null)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-800 dark:text-primary-200">Cancelar</button>
          </div>
        </form>}
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
      </div>
    </dialog>
  )
}
