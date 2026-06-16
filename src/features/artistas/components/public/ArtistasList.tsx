'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Users } from 'lucide-react'
import type { ArtistProfile } from '../../types'
import { ArtistCard } from './ArtistCard'

const ARTIST_TYPES: [string, string][] = [
  ['SINGER', 'Cantante'], ['MUSICIAN', 'Músico/a'], ['DANCER', 'Bailarín/a'],
  ['ACTOR', 'Actor/Actriz'], ['VISUAL_ARTIST', 'Artista visual'], ['PHOTOGRAPHER', 'Fotógrafo/a'],
  ['FILMMAKER', 'Realizador/a'], ['WRITER', 'Escritor/a'], ['PRODUCER', 'Productor/a'],
  ['DJ', 'DJ'], ['COMEDIAN', 'Comediante'], ['PERFORMER', 'Performer'],
  ['MODEL', 'Modelo'], ['MULTIDISCIPLINARY', 'Multidisciplinar'],
]

const SORT_OPTIONS: [string, string][] = [
  ['', 'Orden recomendado'], ['featured', 'Destacados primero'],
  ['popular', 'Populares'], ['followers', 'Más seguidores'], ['views', 'Más vistos'],
]

interface Props {
  artists: ArtistProfile[]
  totalCount: number
}

export function ArtistasList({ artists, totalCount }: Props) {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [artistType, setArtistType] = useState('')
  const [sort, setSort] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    let list = artists
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.stage_name.toLowerCase().includes(q) ||
          (a.short_bio ?? '').toLowerCase().includes(q) ||
          (a.biography ?? '').toLowerCase().includes(q),
      )
    }
    if (city.trim()) {
      const c = city.toLowerCase()
      list = list.filter((a) => a.city.toLowerCase().includes(c))
    }
    if (artistType) list = list.filter((a) => a.artist_type === artistType)
    if (sort === 'featured') list = [...list].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
    if (sort === 'followers') list = [...list].sort((a, b) => b.follower_count - a.follower_count)
    if (sort === 'views') list = [...list].sort((a, b) => b.profile_views - a.profile_views)
    return list
  }, [artists, search, city, artistType, sort])

  function clearAll() {
    setSearch(''); setCity(''); setArtistType(''); setSort('')
  }

  return (
    <div className="bg-primary-50 min-h-screen">
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-gradient-to-br from-neutral-900 via-primary-800 to-primary-700 text-white"
        aria-labelledby="artistas-hero-title"
      >
        {/* Decorative */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-45" aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
          <div className="absolute -right-24 top-0 h-80 w-80 rounded-3xl border border-white/15" />
          <div className="absolute bottom-0 left-0 h-28 w-full bg-gradient-to-t from-neutral-950/40 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-primary-100">
              Catálogo de talento
            </p>
            <h1 id="artistas-hero-title" className="text-balance text-3xl font-black leading-tight md:text-5xl">
              Descubre artistas profesionales
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/80 md:text-lg">
              Explora perfiles artísticos por disciplina, ciudad y tipo de talento. Portafolios reales, servicios y trayectorias listas para conectar.
            </p>
          </div>

          {/* Search form */}
          <div className="mt-7 rounded-2xl border border-white/16 bg-white p-3 text-neutral-900 shadow-sm">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-wrap gap-3"
              role="search"
              aria-label="Buscar artistas"
            >
              <div className="relative min-w-[12rem] flex-1">
                <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nombre, disciplina o palabra clave"
                  className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-neutral-400 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                aria-expanded={showFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
              >
                <SlidersHorizontal size={15} aria-hidden="true" />
                Filtros
              </button>
            </form>

            {/* Expanded filters */}
            {showFilters && (
              <div className="mt-3 flex flex-wrap gap-3 border-t border-neutral-100 pt-3">
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ciudad (ej. Bogotá)"
                  className="w-44 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20"
                />
                <select
                  value={artistType}
                  onChange={(e) => setArtistType(e.target.value)}
                  className="w-52 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-700 outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20"
                >
                  <option value="">Tipo de artista</option>
                  {ARTIST_TYPES.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-52 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-700 outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-700/20"
                >
                  {SORT_OPTIONS.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-500 transition hover:bg-neutral-50"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {filtered.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-neutral-500" aria-live="polite">
              <span className="font-semibold text-neutral-900">{filtered.length}</span>
              {' '}artista{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Users size={36} className="text-neutral-300" aria-hidden="true" />
            <p className="text-lg font-semibold text-neutral-700">No encontramos artistas</p>
            <p className="max-w-sm text-sm text-neutral-500">
              {search || city || artistType
                ? 'Ajusta tu búsqueda o explora otras ciudades y disciplinas.'
                : 'Cuando se registren artistas aparecerán aquí.'}
            </p>
            {(search || city || artistType) && (
              <button
                onClick={clearAll}
                className="rounded-full bg-primary-700 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-800"
              >
                Ver todos los artistas
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
