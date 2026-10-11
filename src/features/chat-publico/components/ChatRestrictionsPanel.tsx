'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  listCommunityChatRestrictions, releaseCommunityChatRestriction,
  type RestrictionItem,
} from '../actions/community-chat-restrictions.actions'
import { openCommunityChatCase } from '../actions/community-chat-cases.actions'

type Cursor = { decidedAt: string; userId: string }
type Selection = { userId: string; label: string; operation: 'restrict' | 'release' }

export default function ChatRestrictionsPanel({ communityId, canBlock, target, onClose }: {
  communityId: string
  canBlock: boolean
  target: { userId: string; label: string } | null
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const requestIdRef = useRef(crypto.randomUUID())
  const [items, setItems] = useState<RestrictionItem[]>([])
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const [selection, setSelection] = useState<Selection | null>(target
    ? { ...target, operation: 'restrict' } : null)
  const [duration, setDuration] = useState('24')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])

  useEffect(() => {
    let active = true
    void listCommunityChatRestrictions(communityId).then((result) => {
      if (!active) return
      if (result.ok) { setItems(result.items); setCursor(result.nextCursor) }
      else setError(result.error)
      setLoading(false)
    }).catch(() => { if (active) { setError('No se pudieron cargar las restricciones.'); setLoading(false) } })
    return () => { active = false }
  }, [communityId])

  const loadMore = async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const result = await listCommunityChatRestrictions(communityId, cursor)
      if (result.ok) {
        setItems((previous) => [...previous, ...result.items.filter((item) =>
          !previous.some((old) => old.user_id === item.user_id))])
        setCursor(result.nextCursor)
      } else setError(result.error)
    } catch { setError('No se pudo cargar la página siguiente.') }
    finally { setLoadingMore(false) }
  }

  const select = (next: Selection) => {
    requestIdRef.current = crypto.randomUUID()
    setSelection(next)
    setReason('')
    setError(null)
    setSuccess(false)
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selection || pending) return
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      try {
        const result = selection.operation === 'release'
          ? await releaseCommunityChatRestriction({ communityId, userId: selection.userId, reason })
          : await openCommunityChatCase({ communityId, userId: selection.userId,
            kind: duration === 'block' ? 'block' : 'suspend',
            hours: duration === 'block' ? null : Number(duration), reason,
            caseId: requestIdRef.current })
        if (!result.ok) { setError(result.error); return }
        setSelection(null)
        requestIdRef.current = crypto.randomUUID()
        setReason('')
        setSuccess(true)
      } catch { setError('No se pudo abrir el expediente. Reintenta sin cambiar el formulario.'); return }
      try {
        const refreshed = await listCommunityChatRestrictions(communityId)
        if (refreshed.ok) { setItems(refreshed.items); setCursor(refreshed.nextCursor) }
        else setError(refreshed.error)
      } catch { setError('La operación se guardó; reabre el panel para actualizar la lista.') }
    })
  }

  return <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onClose() }}
    aria-labelledby="community-chat-restrictions-title"
    className="m-auto max-h-[min(85dvh,720px)] w-[min(38rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-primary-100 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-neutral-950/50 dark:border-primary-900 dark:bg-neutral-900 dark:text-neutral-100">
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-primary-100 bg-white px-4 py-3 dark:border-primary-900 dark:bg-neutral-900">
      <div><h2 id="community-chat-restrictions-title" className="text-base font-semibold text-primary-900 dark:text-primary-100">Moderación del chat</h2>
        <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-300">Abre un expediente antes de limitar la escritura. Las restricciones activas pueden levantarse.</p></div>
      <button type="button" onClick={onClose} className="rounded-lg border border-primary-200 px-2.5 py-1.5 text-xs font-medium text-primary-800 dark:border-primary-800 dark:text-primary-200">Cerrar</button>
    </div>
    <div className="space-y-3 p-4">
      {loading && <p role="status" className="text-sm text-neutral-600">Cargando restricciones…</p>}
      {!loading && !items.length && <p className="rounded-xl bg-primary-50 px-3 py-4 text-sm text-primary-800 dark:bg-primary-950/30 dark:text-primary-200">No hay restricciones activas.</p>}
      {items.map((item) => <article key={item.user_id} className="rounded-xl border border-primary-100 p-3 dark:border-primary-900/60">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0"><p className="break-words text-sm font-semibold text-primary-950 dark:text-primary-100">{item.displayName}</p>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">{item.kind === 'block' ? 'Bloqueo sin fecha de fin' : `Suspensión hasta ${new Date(item.expires_at!).toLocaleString()}`}</p></div>
          {(item.kind !== 'block' || canBlock) && <button type="button" onClick={() => select({ userId: item.user_id, label: item.displayName, operation: 'release' })}
            className="rounded-lg border border-primary-200 px-2.5 py-1.5 text-xs font-semibold text-primary-800 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-200">Levantar</button>}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-200">{item.reason}</p>
      </article>)}
      {cursor && <button type="button" disabled={loadingMore} onClick={() => void loadMore()}
        className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-800 disabled:opacity-50 dark:border-primary-800 dark:text-primary-200">
        {loadingMore ? 'Cargando…' : 'Cargar más'}
      </button>}
      {selection && <form onSubmit={submit} className="space-y-3 rounded-xl border border-secondary-200 bg-secondary-50 p-3 dark:border-secondary-900/40 dark:bg-primary-950/30">
        <p className="text-sm font-semibold text-primary-950 dark:text-primary-100">{selection.operation === 'release' ? 'Levantar restricción de' : 'Abrir expediente para'} {selection.label}</p>
        {selection.operation === 'restrict' && <label className="block text-xs font-semibold text-primary-900 dark:text-primary-100">Duración
          <select value={duration} disabled={pending} onChange={(event) => {
            requestIdRef.current = crypto.randomUUID(); setDuration(event.target.value)
          }}
            className="mt-1 block min-h-10 w-full rounded-lg border border-primary-200 bg-white px-3 text-sm dark:border-primary-800 dark:bg-neutral-900">
            <option value="24">24 horas</option><option value="72">72 horas</option>
            {canBlock && <><option value="168">7 días</option><option value="720">30 días</option><option value="block">Bloqueo hasta revisión</option></>}
          </select>
        </label>}
        <label className="block text-xs font-semibold text-primary-900 dark:text-primary-100">Motivo
          <textarea value={reason} disabled={pending} onChange={(event) => {
            requestIdRef.current = crypto.randomUUID(); setReason(event.target.value)
          }} minLength={10} maxLength={500} rows={3} required
            className="mt-1 block w-full resize-y rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600 dark:border-primary-800 dark:bg-neutral-900" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending || reason.trim().length < 10}
            className="rounded-lg bg-primary-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? 'Guardando…' : selection.operation === 'release' ? 'Levantar restricción' : 'Abrir expediente'}</button>
          <button type="button" disabled={pending} onClick={() => setSelection(null)} className="rounded-lg px-3 py-2 text-xs font-medium text-primary-800 disabled:opacity-50 dark:text-primary-200">Cancelar</button>
        </div>
      </form>}
      {success && <p role="status" className="text-sm text-primary-800 dark:text-primary-200">Operación guardada. Si abriste un expediente, aún no se aplicó una restricción.</p>}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
    </div>
  </dialog>
}
