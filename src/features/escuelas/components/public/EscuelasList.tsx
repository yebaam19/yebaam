'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import type { School, SchoolCategory } from '../../types'
import { SchoolCard } from './SchoolCard'

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC:             'Música',
  ARTS:              'Artes Plásticas',
  DANCE:             'Danza',
  THEATER:           'Teatro',
  MULTIDISCIPLINARY: 'Multidisciplinario',
}

interface Props {
  schools: School[]
  totalCount: number
  initialQuery?: string
  initialCity?: string
  initialCategory?: string
}

export function EscuelasList({
  schools,
  initialQuery = '',
  initialCity = '',
  initialCategory = '',
}: Props) {
  const [query, setQuery]       = useState(initialQuery)
  const [city, setCity]         = useState(initialCity)
  const [category, setCategory] = useState(initialCategory)

  const filtered = useMemo(() => {
    let list = schools
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q),
      )
    }
    if (city.trim()) {
      list = list.filter((s) => s.city.toLowerCase().includes(city.toLowerCase()))
    }
    if (category) {
      list = list.filter((s) => s.category === (category as SchoolCategory))
    }
    return list
  }, [schools, query, city, category])

  const hasFilters = !!(query || city || category)

  function clearAll() {
    setQuery('')
    setCity('')
    setCategory('')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <div className="bg-linear-to-br from-primary-900 via-primary-800 to-primary-700 px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-300">Directorio</p>
          <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">Escuelas artísticas</h1>
          <p className="mt-4 text-base leading-7 text-primary-200">
            Encuentra escuelas de música, danza, artes plásticas, teatro y más.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, ciudad o disciplina…"
                  aria-label="Buscar escuelas"
                  className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/50 outline-none backdrop-blur-sm transition focus:border-white/50 focus:bg-white/20"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filtrar por categoría"
                className="h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white backdrop-blur-sm outline-none transition focus:border-white/50 focus:bg-white/20"
              >
                <option value="" className="text-neutral-900">Todas las disciplinas</option>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v} className="text-neutral-900">{l}</option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Filtrar por ciudad…"
                aria-label="Filtrar por ciudad"
                className="h-10 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/50 outline-none backdrop-blur-sm transition focus:border-white/50 focus:bg-white/20"
              />
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white/80 backdrop-blur-sm transition hover:bg-white/20"
                >
                  <X size={14} aria-hidden="true" />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        {/* Results count + active tags */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <p className="text-sm text-neutral-500" aria-live="polite">
            <strong className="text-neutral-900">{filtered.length}</strong>
            {' '}escuela{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          </p>
          {query && (
            <span className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              🔍 {query}
              <button onClick={() => setQuery('')} className="ml-0.5 text-primary-400 hover:text-primary-700" aria-label="Quitar filtro de búsqueda">×</button>
            </span>
          )}
          {city && (
            <span className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              📍 {city}
              <button onClick={() => setCity('')} className="ml-0.5 text-primary-400 hover:text-primary-700" aria-label="Quitar filtro de ciudad">×</button>
            </span>
          )}
          {category && (
            <span className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              🎓 {CATEGORY_LABELS[category] ?? category}
              <button onClick={() => setCategory('')} className="ml-0.5 text-primary-400 hover:text-primary-700" aria-label="Quitar filtro de categoría">×</button>
            </span>
          )}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <span className="text-5xl" aria-hidden="true">🎓</span>
            <p className="text-lg font-semibold text-neutral-700">
              {hasFilters ? 'Sin resultados para estos filtros' : 'Aún no hay escuelas publicadas'}
            </p>
            <p className="max-w-sm text-sm text-neutral-500">
              {hasFilters
                ? 'Prueba con otros términos o limpia los filtros.'
                : 'Cuando se registren escuelas aparecerán aquí.'}
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="rounded-full bg-primary-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-800"
              >
                Ver todas las escuelas
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
