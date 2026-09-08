'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { setNewsSourceStatusAction } from '../actions/news.actions'
import type { CityNewsSource } from '../server/news-author.server'

const statusLabels: Record<CityNewsSource['status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  suspended: 'Suspendida',
}

export function CityNewsSourceManager({ cityName, sources }: { cityName: string; sources: CityNewsSource[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function update(sourceId: string, status: 'approved' | 'suspended') {
    setPendingId(sourceId)
    setMessage(null)
    const result = await setNewsSourceStatusAction({ sourceId, status })
    setPendingId(null)
    if (!result.ok) return setMessage(result.error)
    setMessage(status === 'approved' ? 'Fuente aprobada.' : 'Fuente suspendida.')
    window.location.reload()
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <p className="text-sm font-semibold text-primary-700 dark:text-primary-400">Administración local</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.03em]">Fuentes de {cityName}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">Revisa la identidad editorial y el sitio de cada fuente antes de permitir que publique noticias locales.</p>
      </header>
      {sources.length ? (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {sources.map((source) => {
            const isApproved = source.status === 'approved'
            const nextStatus = isApproved ? 'suspended' : 'approved'
            const actionLabel = isApproved ? 'Suspender' : source.status === 'suspended' ? 'Reactivar' : 'Aprobar'
            return <li key={source.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{source.name}</h2><span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{statusLabels[source.status]}</span></div>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Responsable: {source.ownerName}</p>
                {source.websiteUrl && <a href={source.websiteUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 rounded text-sm font-semibold text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400">Revisar sitio <ExternalLink className="size-3.5" aria-hidden="true" /></a>}
              </div>
              <button disabled={pendingId === source.id} onClick={() => update(source.id, nextStatus)} className={`min-h-10 rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 ${isApproved ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800' : 'bg-primary-700 font-bold text-white hover:bg-primary-800 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950'}`}>{pendingId === source.id ? 'Guardando…' : actionLabel}</button>
            </li>
          })}
        </ul>
      ) : <p className="border-b border-neutral-200 py-12 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">No hay fuentes registradas para esta ciudad.</p>}
      {message && <p role="status" className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">{message}</p>}
    </div>
  )
}
