'use client'

import { FormEvent, useState } from 'react'
import { Copy } from 'lucide-react'
import { requestNewsReplicaAction } from '../actions/news.actions'
import type { NewsReplicaEntity } from '../types'

const typeLabels: Record<NewsReplicaEntity['type'], string> = {
  professional_profile: 'Perfil profesional',
  page: 'Página verificada',
  organization: 'Organización verificada',
}

export function NewsReplicaForm({ articleId, entities }: { articleId: string; entities: NewsReplicaEntity[] }) {
  const [open, setOpen] = useState(false)
  const [selection, setSelection] = useState(entities[0] ? `${entities[0].type}:${entities[0].id}` : '')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const entity = entities.find((candidate) => `${candidate.type}:${candidate.id}` === selection)
    if (!entity) return setMessage('Selecciona una entidad verificada.')
    setPending(true)
    setMessage(null)
    const result = await requestNewsReplicaAction({ articleId, entityType: entity.type, entityId: entity.id })
    setPending(false)
    if (!result.ok) return setMessage(result.error)
    setOpen(false)
    setMessage('Solicitud enviada para validación de la plataforma.')
  }

  if (!entities.length) return <p className="mt-5 text-xs leading-5 text-neutral-500 dark:text-neutral-400">Las réplicas están disponibles para perfiles profesionales y páginas verificadas.</p>

  return (
    <div className="mt-5">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-primary-300">
        <Copy className="size-3.5" aria-hidden="true" /> Solicitar réplica legitimada
      </button>
      {open && (
        <form onSubmit={submit} className="mt-3 border-y border-neutral-200 py-4 dark:border-neutral-800">
          <label htmlFor="news-replica-entity" className="text-sm font-semibold text-neutral-900 dark:text-white">Publicar debajo de</label>
          <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">Yebaam revisará la solicitud antes de vincular esta noticia con tu entidad.</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select id="news-replica-entity" required value={selection} onChange={(event) => setSelection(event.target.value)} className="min-h-11 flex-1 rounded-xl border border-neutral-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-950">
              {entities.map((entity) => <option key={`${entity.type}:${entity.id}`} value={`${entity.type}:${entity.id}`}>{entity.name} · {typeLabels[entity.type]}</option>)}
            </select>
            <button disabled={pending} className="min-h-11 rounded-xl bg-primary-700 px-4 text-sm font-bold text-white transition-colors hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 dark:focus-visible:ring-offset-neutral-950">{pending ? 'Enviando…' : 'Enviar solicitud'}</button>
          </div>
        </form>
      )}
      {message && <p role="status" className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{message}</p>}
    </div>
  )
}
