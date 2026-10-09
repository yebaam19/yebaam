'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  listCommunityChatReviews, resolveCommunityChatReview, submitCommunityChatReview,
} from '../actions/community-chat-review.actions'
import type { CommunityChatRestriction, CommunityChatReview } from '../types'

type Cursor = { submittedAt: string; id: string }
type Selection = { requestId: string; decision: 'uphold' | 'lift' }

export default function ChatReviewPanel({ communityId, scope, restriction, canBlock, onClose }: {
  communityId: string
  scope: 'mine' | 'staff'
  restriction: CommunityChatRestriction | null
  canBlock: boolean
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [items, setItems] = useState<CommunityChatReview[]>([])
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [statement, setStatement] = useState('')
  const [reason, setReason] = useState('')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])

  useEffect(() => {
    let active = true
    void listCommunityChatReviews(communityId, scope).then((result) => {
      if (!active) return
      if (result.ok) { setItems(result.items); setCursor(result.nextCursor) }
      else setError(result.error)
      setLoading(false)
    }).catch(() => { if (active) { setError('No se pudo cargar la revisión.'); setLoading(false) } })
    return () => { active = false }
  }, [communityId, scope])

  const refresh = async () => {
    const result = await listCommunityChatReviews(communityId, scope)
    if (result.ok) { setItems(result.items); setCursor(result.nextCursor) }
    else setError(result.error)
  }

  const loadMore = async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const result = await listCommunityChatReviews(communityId, scope, cursor)
      if (result.ok) {
        setItems((previous) => [...previous, ...result.items.filter((item) =>
          !previous.some((old) => old.id === item.id))])
        setCursor(result.nextCursor)
      } else setError(result.error)
    } catch { setError('No se pudo cargar la página siguiente.') }
    finally { setLoadingMore(false) }
  }

  const defense = restriction && items.find((item) =>
    item.restriction_version === restriction.version && item.stage === 'defense')
  const appeal = restriction && items.find((item) =>
    item.restriction_version === restriction.version && item.stage === 'appeal')
  const nextStage = restriction && !defense ? 'defense'
    : defense?.status === 'upheld' && !appeal ? 'appeal' : null

  const send = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const result = await submitCommunityChatReview({ communityId, statement })
        if (!result.ok) { setError(result.error); return }
        setStatement('')
        setSuccess('Tu solicitud quedó registrada.')
        try { await refresh() }
        catch { setError('La solicitud se guardó; reabre el panel para actualizar la lista.') }
      } catch { setError('No se pudo enviar la solicitud.') }
    })
  }

  const decide = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending || !selection) return
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const result = await resolveCommunityChatReview({ ...selection, reason })
        if (!result.ok) { setError(result.error); return }
        setSelection(null)
        setReason('')
        setSuccess('Revisión guardada y notificada.')
        try { await refresh() }
        catch { setError('La revisión se guardó; reabre el panel para actualizar la lista.') }
      } catch { setError('No se pudo guardar la revisión.') }
    })
  }

  return <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onClose() }}
    aria-labelledby="community-chat-review-title"
    className="m-auto max-h-[min(85dvh,720px)] w-[min(38rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-primary-100 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-neutral-950/50 dark:border-primary-900 dark:bg-neutral-900 dark:text-neutral-100">
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-primary-100 bg-white px-4 py-3 dark:border-primary-900 dark:bg-neutral-900">
      <div><h2 id="community-chat-review-title" className="text-base font-semibold text-primary-900 dark:text-primary-100">
        {scope === 'mine' ? 'Mis revisiones del chat' : 'Solicitudes de revisión'}
      </h2><p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-300">
        {scope === 'mine' ? 'Presenta descargos y, si se mantiene la decisión, una apelación.'
          : 'Lee los descargos y registra el motivo de tu decisión.'}
      </p></div>
      <button type="button" onClick={onClose} className="rounded-lg border border-primary-200 px-2.5 py-1.5 text-xs font-medium text-primary-800 dark:border-primary-800 dark:text-primary-200">Cerrar</button>
    </div>
    <div className="space-y-3 p-4">
      {loading && <p role="status" className="text-sm text-neutral-600">Cargando solicitudes…</p>}
      {!loading && !items.length && <p className="rounded-xl bg-primary-50 px-3 py-4 text-sm text-primary-800 dark:bg-primary-950/30 dark:text-primary-200">No hay solicitudes.</p>}
      {items.map((item) => <article key={item.id} className="rounded-xl border border-primary-100 p-3 dark:border-primary-900/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-primary-900 dark:text-primary-100">
            {scope === 'staff' && item.displayName ? item.displayName + ' · ' : ''}
            {item.stage === 'defense' ? 'Descargos' : 'Apelación'}
          </p>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-800 dark:bg-primary-950/40 dark:text-primary-200">
            {item.status === 'open' ? 'Pendiente' : item.status === 'upheld' ? 'Decisión mantenida'
              : item.status === 'lifted' ? 'Restricción levantada' : 'Decisión reemplazada'}
          </span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">{new Date(item.submitted_at).toLocaleString()}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-100">{item.statement}</p>
        {item.review_reason && <p className="mt-2 rounded-lg bg-secondary-50 px-2.5 py-2 text-xs text-primary-900 dark:bg-primary-950/30 dark:text-primary-100">Respuesta: {item.review_reason}</p>}
        {scope === 'staff' && item.status === 'open' && (item.stage === 'defense' || canBlock)
          && <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setSelection({ requestId: item.id, decision: 'uphold' }); setReason(''); setError(null) }}
              className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-800 dark:border-primary-800 dark:text-primary-200">Mantener</button>
            {(canBlock || item.restrictionKind === 'suspend') && <button type="button"
              onClick={() => { setSelection({ requestId: item.id, decision: 'lift' }); setReason(''); setError(null) }}
              className="rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-800 dark:border-primary-800 dark:text-primary-200">Levantar</button>}
          </div>}
      </article>)}
      {cursor && <button type="button" disabled={loadingMore} onClick={() => void loadMore()}
        className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-800 disabled:opacity-50 dark:border-primary-800 dark:text-primary-200">
        {loadingMore ? 'Cargando…' : 'Cargar más'}
      </button>}
      {scope === 'mine' && nextStage && <form onSubmit={send} className="space-y-3 rounded-xl border border-secondary-200 bg-secondary-50 p-3 dark:border-primary-800 dark:bg-primary-950/30">
        <label className="block text-xs font-semibold text-primary-900 dark:text-primary-100">
          {nextStage === 'defense' ? 'Presentar descargos' : 'Presentar apelación'}
          <textarea value={statement} disabled={pending} onChange={(event) => setStatement(event.target.value)}
            minLength={10} maxLength={2000} rows={4} required
            className="mt-1 block w-full resize-y rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 dark:border-primary-800 dark:bg-neutral-900" />
        </label>
        <button type="submit" disabled={pending || statement.trim().length < 10}
          className="rounded-lg bg-primary-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Enviar solicitud</button>
      </form>}
      {scope === 'staff' && selection && <form onSubmit={decide} className="space-y-3 rounded-xl border border-secondary-200 bg-secondary-50 p-3 dark:border-primary-800 dark:bg-primary-950/30">
        <label className="block text-xs font-semibold text-primary-900 dark:text-primary-100">Motivo de la revisión
          <textarea value={reason} disabled={pending} onChange={(event) => setReason(event.target.value)}
            minLength={10} maxLength={500} rows={3} required
            className="mt-1 block w-full resize-y rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 dark:border-primary-800 dark:bg-neutral-900" />
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={pending || reason.trim().length < 10}
            className="rounded-lg bg-primary-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Confirmar decisión</button>
          <button type="button" disabled={pending} onClick={() => setSelection(null)} className="rounded-lg px-3 py-2 text-xs text-primary-800 disabled:opacity-50 dark:text-primary-200">Cancelar</button>
        </div>
      </form>}
      {success && <p role="status" className="text-sm text-primary-800 dark:text-primary-200">{success}</p>}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
    </div>
  </dialog>
}
