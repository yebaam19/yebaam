'use client'

import { useState } from 'react'
import Link from 'next/link'

const OPP_TYPES: Record<string, string> = {
  CASTING: 'Casting', AUDITION: 'Audición', COLLABORATION: 'Colaboración',
  FESTIVAL: 'Festival', CULTURAL_CALL: 'Convocatoria', BRAND_CAMPAIGN: 'Campaña de marca',
  JOB: 'Empleo', EXHIBITION: 'Exhibición', CONTEST: 'Concurso',
}

export interface OpportunitySummary {
  id: string
  slug?: string | null
  title: string
  description?: string | null
  opportunity_type: string
  is_active: boolean
  ends_at?: string | null
}

function OpportunityCard({ item }: { item: OpportunitySummary }) {
  const typeLabel = OPP_TYPES[item.opportunity_type] ?? item.opportunity_type
  return (
    <Link
      href={`/artistas/oportunidades/${item.slug ?? item.id}` as never}
      className="group overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-800">
          {typeLabel}
        </span>
        {!item.is_active && (
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500">
            Cerrada
          </span>
        )}
      </div>
      <h3 className="mt-3 font-semibold text-neutral-950 line-clamp-2">{item.title}</h3>
      {item.description && (
        <p className="mt-2 text-sm text-neutral-500 line-clamp-3">{item.description}</p>
      )}
      {item.ends_at && (
        <p className="mt-3 text-xs text-neutral-400">
          Cierre: {new Date(item.ends_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </Link>
  )
}

export function OpportunitiesListView({ opportunities }: { opportunities: OpportunitySummary[] }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')

  const filtered = opportunities.filter((o) => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase())
    const matchType = !type || o.opportunity_type === type
    return matchSearch && matchType
  })

  if (opportunities.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
          <span className="text-2xl">💼</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-neutral-900">No hay oportunidades abiertas</h3>
        <p className="mt-2 text-sm text-neutral-500">Pronto aparecerán convocatorias, castings y colaboraciones para artistas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar oportunidad…"
          className="min-w-[12rem] flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/10"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 focus:border-primary-700 focus:outline-none"
        >
          <option value="">Tipo de oportunidad</option>
          {Object.entries(OPP_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl" aria-hidden="true">🔍</span>
          <p className="text-base font-semibold text-neutral-700">Sin resultados</p>
          <p className="max-w-xs text-sm text-neutral-500">No encontramos oportunidades con esos filtros. Intenta con otros términos.</p>
          <button
            onClick={() => { setSearch(''); setType('') }}
            className="mt-1 rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-800"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-500">
            <span className="font-semibold text-neutral-900">{filtered.length}</span> oportunidades disponibles
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => <OpportunityCard key={item.id} item={item} />)}
          </div>
        </>
      )}
    </div>
  )
}
