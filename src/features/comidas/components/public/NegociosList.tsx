'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Plus, Search, Store, Star, Wifi } from 'lucide-react'
import type { Business } from '../../types'
import { BusinessCard } from './BusinessCard'

type FilterTab = 'todos' | 'top' | 'whatsapp' | 'seguidos'

interface Props {
  businesses: Business[]
  totalCount: number
  isAuthenticated?: boolean
  followedIds?: Set<string>
}

export function NegociosList({ businesses, totalCount, isAuthenticated = false, followedIds }: Props) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('todos')

  const topCount = useMemo(
    () => businesses.filter((b) => Number(b.avg_rating) >= 4.5).length,
    [businesses],
  )

  const filtered = useMemo(() => {
    let list = businesses
    if (query.trim()) {
      const q = query.toLowerCase()
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
  }, [businesses, query, activeTab])

  const followedCount = useMemo(
    () => businesses.filter((b) => followedIds?.has(b.id)).length,
    [businesses, followedIds],
  )

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'top', label: '⭐ Top' },
    { id: 'whatsapp', label: '💬 WhatsApp' },
    ...(isAuthenticated
      ? [{ id: 'seguidos' as FilterTab, label: followedCount > 0 ? `★ Siguiendo (${followedCount})` : '★ Siguiendo' }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative overflow-hidden py-14 px-4"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgb(22,164,76,0.18) 0%, transparent 70%), rgb(240,252,245)',
        }}
      >
        {/* Back to main app — (comidas) pages live outside the (app) layout */}
        <Link
          href="/feed"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
        >
          ← Feed
        </Link>

        {isAuthenticated && (
          <Link
            href="/negocios/crear"
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-800"
          >
            <Plus size={13} aria-hidden="true" />
            Registrar negocio
          </Link>
        )}

        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-2 text-sm font-semibold tracking-widest text-primary-700 uppercase">
            Yebaam Negocios
          </p>
          <h1 className="mb-4 text-4xl font-black tracking-tight text-neutral-900 sm:text-5xl">
            Negocios de tu comunidad
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base text-neutral-500">
            Sigue negocios, recibe sus novedades en tu feed y conecta directamente con ellos.
          </p>

          {/* Metrics */}
          <div className="mb-8 flex flex-wrap justify-center gap-6">
            <MetricBadge icon={<Store size={15} />} label="Negocios" value={totalCount} />
            <MetricBadge icon={<Star size={15} />} label="Top rated" value={topCount} />
            <MetricBadge
              icon={<Wifi size={15} />}
              label="Con WhatsApp"
              value={businesses.filter((b) => b.whatsapp).length}
            />
          </div>

          {/* Search */}
          <div className="relative mx-auto max-w-lg">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, ciudad..."
              className="w-full rounded-full border border-neutral-200 bg-white py-3 pl-11 pr-5 text-sm shadow-sm outline-none ring-0 transition placeholder:text-neutral-400 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20"
            />
          </div>

          {/* Owner acquisition banner — always visible for authenticated users,
              not just on empty/no-follows state */}
          {isAuthenticated && (
            <div className="mx-auto mt-6 flex max-w-lg items-center justify-between gap-4 rounded-2xl border border-primary-100 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-left text-sm text-neutral-600">
                <span className="font-semibold text-neutral-900">¿Tienes un negocio?</span>{' '}
                Regístralo gratis y publica novedades para tus clientes.
              </p>
              <Link
                href="/negocios/crear"
                className="shrink-0 rounded-xl bg-primary-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-800"
              >
                Registrar
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Filter tabs + grid */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'rounded-full px-5 py-2 text-sm font-semibold transition',
                activeTab === tab.id
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-neutral-400">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {filtered.length === 0 && activeTab === 'seguidos' ? (
          <EmptyStateFollowing onExplore={() => setActiveTab('todos')} />
        ) : filtered.length === 0 ? (
          <EmptyState query={query} onClear={() => { setQuery(''); setActiveTab('todos') }} />
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

function MetricBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2 text-sm shadow-sm backdrop-blur-sm">
      <span className="text-primary-700">{icon}</span>
      <span className="font-black text-neutral-900">{value}</span>
      <span className="text-neutral-500">{label}</span>
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
        onClick={onExplore}
        className="rounded-full bg-primary-700 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-800"
      >
        Explorar negocios
      </button>
    </div>
  )
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="text-5xl">🍽️</span>
      <p className="text-lg font-semibold text-neutral-700">
        {query ? `Sin resultados para "${query}"` : 'No hay negocios registrados aún'}
      </p>
      <p className="max-w-sm text-sm text-neutral-500">
        {query
          ? 'Intenta con otro término o limpia los filtros.'
          : 'Cuando se registren negocios aparecerán aquí.'}
      </p>
      {query && (
        <button
          onClick={onClear}
          className="rounded-full bg-primary-700 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-800"
        >
          Limpiar búsqueda
        </button>
      )}
    </div>
  )
}
