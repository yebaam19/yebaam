'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import type { School, SchoolCategory } from '../../types'
import { SchoolCard } from './SchoolCard'

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: 'Música',
  ARTS: 'Artes Plásticas',
  DANCE: 'Danza',
  THEATER: 'Teatro',
  MULTIDISCIPLINARY: 'Multidisciplinario',
}

const inputCls =
  'rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20'

interface Props {
  schools: School[]
  totalCount: number
}

export function EscuelasList({ schools }: Props) {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')

  const filtered = useMemo(() => {
    let list = schools
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          (s.description ?? '').toLowerCase().includes(q),
      )
    }
    if (city.trim()) list = list.filter((s) => s.city.toLowerCase().includes(city.toLowerCase()))
    if (category) list = list.filter((s) => s.category === (category as SchoolCategory))
    return list
  }, [schools, search, city, category])

  const hasFilters = !!(search || city || category)

  function clearAll() {
    setSearch(''); setCity(''); setCategory('')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-300">Directorio</p>
          <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">Escuelas artísticas</h1>
          <p className="mt-4 text-base leading-7 text-primary-200">
            Encuentra escuelas de música, danza, artes plásticas, teatro y más cerca de ti.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">

        {/* Filter panel */}
        <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            {/* Search */}
            <div className="min-w-[180px] flex-1">
              <label htmlFor="search-schools" className="mb-1.5 block text-xs font-semibold text-neutral-500">
                Buscar
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                />
                <input
                  id="search-schools"
                  type="text"
                  placeholder="Nombre o ciudad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label htmlFor="filter-city" className="mb-1.5 block text-xs font-semibold text-neutral-500">
                Ciudad
              </label>
              <input
                id="filter-city"
                type="text"
                placeholder="Ej. Bogotá"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="filter-category" className="mb-1.5 block text-xs font-semibold text-neutral-500">
                Disciplina
              </label>
              <select
                id="filter-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                <option value="">Todas</option>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            {/* Clear */}
            {hasFilters && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-50"
              >
                <X size={14} aria-hidden="true" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {filtered.length > 0 ? (
          <>
            <p className="mb-5 text-sm text-neutral-500" aria-live="polite">
              <strong className="text-neutral-900">{filtered.length}</strong>
              {' '}escuela{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
              {hasFilters && (
                <span>
                  {' '}·{' '}
                  <button onClick={clearAll} className="text-primary-700 hover:underline">
                    Limpiar filtros
                  </button>
                </span>
              )}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((school) => (
                <SchoolCard key={school.id} school={school} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <GraduationCapIcon />
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

function GraduationCapIcon() {
  return (
    <svg className="h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  )
}
