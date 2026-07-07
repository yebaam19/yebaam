'use client'

import { useState, useMemo } from 'react'
import type { Business } from '../../types'
import { BusinessCard } from './BusinessCard'

type FilterTab = 'todos' | 'top' | 'whatsapp' | 'seguidos'

interface Props {
  businesses: Business[]
  totalCount: number
  /** Pre-populated from the Hero's ?q= URL param so the two search surfaces stay in sync. */
  initialQuery?: string
  isAuthenticated?: boolean
  followedIds?: Set<string>
}

export function NegociosList({
  businesses,
  totalCount,
  initialQuery = '',
  isAuthenticated = false,
  followedIds,
}: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>('todos')

  const filtered = useMemo(() => {
    let list = businesses
    if (initialQuery.trim()) {
      const q = initialQuery.toLowerCase()
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.city ?? '').toLowerCase().includes(q) ||
          (b.description ?? '').toLowerCase().includes(q),
      )
    }
    if (activeTab === 'top') list = list.filter((b) => Number(b.avg_rating) >= 4.5)
    if (activeTab === 'whatsapp') list = list.filter((b) => Boolean(b.whatsapp))
    if (activeTab === 'seguidos') list = list.filter((b) => followedIds?.has(b.id))
    return list
  }, [businesses, initialQuery, activeTab])

  const followedCount = useMemo(
    () => businesses.filter((b) => followedIds?.has(b.id)).length,
    [businesses, followedIds],
  )

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'todos',    label: 'Todos' },
    { id: 'top',      label: '⭐ Top' },
    { id: 'whatsapp', label: '💬 WhatsApp' },
    ...(isAuthenticated
      ? [{ id: 'seguidos' as FilterTab, label: followedCount > 0 ? `★ Siguiendo (${followedCount})` : '★ Siguiendo' }]
      : []),
  ]

  return (
    <div className="bg-white">
      {/* Filter tabs */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'rounded-full px-5 py-2 text-sm font-semibold transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}

          <span className="ml-auto self-center text-xs text-neutral-400">
            {initialQuery
              ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} para "${initialQuery}"`
              : `${filtered.length} negocio${filtered.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Results grid */}
        {filtered.length === 0 && activeTab === 'seguidos' ? (
          <EmptyStateFollowing onExplore={() => setActiveTab('todos')} />
        ) : filtered.length === 0 ? (
          <EmptyState query={initialQuery} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                isFollowed={followedIds?.has(b.id)}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function EmptyStateFollowing({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="text-5xl">⭐</span>
      <p className="text-lg font-semibold text-neutral-700">Aún no sigues ningún negocio</p>
      <p className="max-w-sm text-sm text-neutral-500">
        Cuando sigas un negocio, sus novedades aparecerán en tu feed. Explora y encuentra tus favoritos.
      </p>
      <button
        type="button"
        onClick={onExplore}
        className="rounded-full bg-primary-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-800"
      >
        Explorar negocios
      </button>
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="text-5xl">🍽️</span>
      <p className="text-lg font-semibold text-neutral-700">
        {query ? `Sin resultados para "${query}"` : 'No hay negocios registrados aún'}
      </p>
      <p className="max-w-sm text-sm text-neutral-500">
        {query
          ? 'Prueba buscando por categoría, ciudad u otro nombre.'
          : 'Cuando se registren negocios aparecerán aquí.'}
      </p>
      {query && (
        <a
          href="/negocios"
          className="rounded-full bg-primary-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-800"
        >
          Ver todos los negocios
        </a>
      )}
    </div>
  )
}
