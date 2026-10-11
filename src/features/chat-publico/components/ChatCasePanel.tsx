'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  listCommunityChatCases, resolveCommunityChatCase,
  submitCommunityChatCaseDefense, type ChatCaseItem,
} from '../actions/community-chat-cases.actions'

type Cursor = { createdAt: string; id: string }
type Decision = 'dismiss' | 'warn' | 'restrict'

export default function ChatCasePanel({ communityId, scope, onClose }: {
  communityId: string; scope: 'mine' | 'staff'; onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const router = useRouter()
  const [items, setItems] = useState<ChatCaseItem[]>([])
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [decision, setDecision] = useState<Decision>('dismiss')
  const [statement, setStatement] = useState('')
  const [reason, setReason] = useState('')
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
    void listCommunityChatCases(communityId, scope).then((result) => {
      if (!active) return
      if (result.ok) { setItems(result.items); setCursor(result.nextCursor) }
      else setError(result.error)
      setLoading(false)
    }).catch(() => { if (active) { setError('No se pudieron cargar los expedientes.'); setLoading(false) } })
    return () => { active = false }
  }, [communityId, scope])

  const refresh = async () => {
    const result = await listCommunityChatCases(communityId, scope)
    if (result.ok) { setItems(result.items); setCursor(result.nextCursor) }
    else setError(result.error)
  }

  const loadMore = async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const result = await listCommunityChatCases(communityId, scope, cursor)
      if (result.ok) {
        setItems((previous) => [...previous, ...result.items.filter((item) =>
          !previous.some((old) => old.id === item.id))])
        setCursor(result.nextCursor)
      } else setError(result.error)
    } catch { setError('No se pudo cargar la página siguiente.') }
    finally { setLoadingMore(false) }
  }

  const sendDefense = (event: React.FormEvent<HTMLFormElement>, caseId: string) => {
    event.preventDefault()
    if (pending) return
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const result = await submitCommunityChatCaseDefense({ caseId, statement })
        if (!result.ok) { setError(result.error); return }
        setSelected(null)
        setStatement('')
        setSuccess('Tus descargos quedaron registrados.')
        await refresh()
      } catch { setError('No se pudieron enviar los descargos. Conserva el texto y reintenta.') }
    })
  }

  const resolve = (event: React.FormEvent<HTMLFormElement>, caseId: string) => {
    event.preventDefault()
    if (pending) return
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const result = await resolveCommunityChatCase({ caseId, decision, reason })
        if (!result.ok) { setError(result.error); return }
        setSelected(null)
        setReason('')
        setSuccess('Resolución guardada y notificada.')
        await refresh()
        router.refresh()
      } catch { setError('No se pudo guardar la resolución. Conserva el motivo y reintenta.') }
    })
  }

  return <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onClose() }}
    aria-labelledby="community-chat-cases-title"
    className="m-auto max-h-[min(85dvh,720px)] w-[min(40rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-primary-100 bg-white p-0 text-neutral-900 shadow-xl backdrop:bg-neutral-950/50 dark:border-primary-900 dark:bg-neutral-900 dark:text-neutral-100">
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-primary-100 bg-white px-4 py-3 dark:border-primary-900 dark:bg-neutral-900">
      <div><h2 id="community-chat-cases-title" className="text-base font-semibold text-primary-900 dark:text-primary-100">
        {scope === 'mine' ? 'Mis expedientes del chat' : 'Expedientes del chat'}
      </h2><p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-300">
        {scope === 'mine' ? 'Presenta tus descargos antes de cualquier restricción.'
          : 'Revisa los descargos antes de decidir. Una primera falta requiere advertencia.'}
      </p></div>
      <button type="button" onClick={onClose} className="rounded-lg border border-primary-200 px-2.5 py-1.5 text-xs font-medium text-primary-800 dark:border-primary-800 dark:text-primary-200">Cerrar</button>
    </div>
    <div className="space-y-3 p-4">
      {loading && <p role="status" className="text-sm text-neutral-600">Cargando expedientes…</p>}
      {!loading && !items.length && <p className="rounded-xl bg-primary-50 px-3 py-4 text-sm text-primary-800 dark:bg-primary-950/30 dark:text-primary-200">No hay expedientes.</p>}
      {items.map((item) => {
        const defenseOpen = item.status !== 'resolved' && !item.defense_statement
          && (!item.defense_deadline || Date.parse(item.defense_deadline) >= Date.now())
        const ready = item.status === 'open' && !!item.defense_deadline
          && Date.parse(item.defense_deadline) <= Date.now()
        return <article key={item.id} className="rounded-xl border border-primary-100 p-3 dark:border-primary-900/60">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="min-w-0 text-sm font-semibold text-primary-950 dark:text-primary-100">
              {scope === 'staff' ? `${item.displayName} · ` : ''}{item.kind === 'block' ? 'Bloqueo propuesto'
                : `Suspensión propuesta: ${item.duration_hours} h`}
            </p>
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-950/40 dark:text-primary-200">
              {item.status === 'pending_notice' ? 'Correo pendiente' : item.status === 'open'
                ? 'En revisión' : item.outcome === 'restrict' ? 'Restricción aplicada'
                  : item.outcome === 'warn' ? 'Advertencia' : 'Archivado'}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{new Date(item.created_at).toLocaleString()}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-100">{item.reason}</p>
          {item.defense_deadline && <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
            Descargos hasta {new Date(item.defense_deadline).toLocaleString()}
          </p>}
          {item.defense_statement && <p className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
            <strong>Descargos:</strong> {item.defense_statement}
          </p>}
          {item.resolution_reason && <p className="mt-2 rounded-lg bg-secondary-50 px-3 py-2 text-sm text-primary-950 dark:bg-primary-950/30 dark:text-primary-100">
            <strong>Resolución:</strong> {item.resolution_reason}
          </p>}
          {scope === 'mine' && defenseOpen && selected !== item.id && <button type="button"
            onClick={() => { setSelected(item.id); setStatement(''); setError(null) }}
            className="mt-3 rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-800 dark:border-primary-800 dark:text-primary-200">Presentar descargos</button>}
          {scope === 'staff' && ready && item.canReview && selected !== item.id && <button type="button"
            onClick={() => { setSelected(item.id); setDecision('dismiss'); setReason(''); setError(null) }}
            className="mt-3 rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-800 dark:border-primary-800 dark:text-primary-200">Resolver</button>}
          {selected === item.id && scope === 'mine' && <form onSubmit={(event) => sendDefense(event, item.id)} className="mt-3 space-y-2">
            <label className="block text-xs font-semibold text-primary-900 dark:text-primary-100">Tus descargos
              <textarea value={statement} onChange={(event) => setStatement(event.target.value)} disabled={pending}
                minLength={10} maxLength={2000} rows={4} required
                className="mt-1 block w-full resize-y rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm dark:border-primary-800 dark:bg-neutral-900" />
            </label>
            <button type="submit" disabled={pending || statement.trim().length < 10}
              className="rounded-lg bg-primary-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Enviar descargos</button>
          </form>}
          {selected === item.id && scope === 'staff' && <form onSubmit={(event) => resolve(event, item.id)} className="mt-3 space-y-2">
            <label className="block text-xs font-semibold text-primary-900 dark:text-primary-100">Decisión
              <select value={decision} onChange={(event) => setDecision(event.target.value as Decision)} disabled={pending}
                className="mt-1 block min-h-10 w-full rounded-lg border border-primary-200 bg-white px-3 text-sm dark:border-primary-800 dark:bg-neutral-900">
                <option value="dismiss">Archivar sin medida</option>
                <option value="warn">Advertir sin restringir</option>
                <option value="restrict">Aplicar la restricción propuesta</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-primary-900 dark:text-primary-100">Motivo de la resolución
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} disabled={pending}
                minLength={10} maxLength={500} rows={3} required
                className="mt-1 block w-full resize-y rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm dark:border-primary-800 dark:bg-neutral-900" />
            </label>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">La restricción exige una advertencia previa; el bloqueo exige además una suspensión anterior.</p>
            <button type="submit" disabled={pending || reason.trim().length < 10}
              className="rounded-lg bg-primary-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Guardar resolución</button>
          </form>}
        </article>
      })}
      {cursor && <button type="button" disabled={loadingMore} onClick={() => void loadMore()}
        className="w-full rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-800 disabled:opacity-50 dark:border-primary-800 dark:text-primary-200">
        {loadingMore ? 'Cargando…' : 'Cargar más'}
      </button>}
      {success && <p role="status" className="text-sm text-primary-800 dark:text-primary-200">{success}</p>}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
    </div>
  </dialog>
}
