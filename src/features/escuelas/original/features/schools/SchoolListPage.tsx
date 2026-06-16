import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import type { SchoolSummary } from '../../types';

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC:             'Música',
  ARTS:              'Artes Plásticas',
  DANCE:             'Danza',
  THEATER:           'Teatro',
  MULTIDISCIPLINARY: 'Multidisciplinario',
};

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=70',
  'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=800&q=70',
];

interface Filters { search: string; city: string; category: string }
const EMPTY_FILTERS: Filters = { search: '', city: '', category: '' };

function inputClass(full = false) {
  return `${full ? 'w-full' : ''} rounded-xl border border-[#dce8dc] bg-white px-4 py-2.5 text-sm text-[#151d18] placeholder:text-[#9aab9c] transition focus:border-[#006b2d] focus:outline-none focus:ring-2 focus:ring-[#006b2d]/20`;
}

export default function SchoolListPage() {
  const [searchParams] = useSearchParams();
  const [schools, setSchools]   = useState<SchoolSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filters, setFilters]   = useState<Filters>({
    ...EMPTY_FILTERS,
    search: searchParams.get('search') ?? '',
    category: searchParams.get('category') ?? '',
  });

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filters.search)   p.set('search',   filters.search);
    if (filters.city)     p.set('city',     filters.city);
    if (filters.category) p.set('category', filters.category);
    api.get<{ ok: boolean; data: SchoolSummary[] }>(`/schools${p.toString() ? `?${p}` : ''}`)
      .then((r) => { setSchools(r.data.data); setError(null); })
      .catch((e: { message?: string }) => setError(e.message ?? 'No fue posible cargar las escuelas'))
      .finally(() => setLoading(false));
  }, [filters]);

  function setFilter<K extends keyof Filters>(k: K, v: string) {
    setFilters((prev) => ({ ...prev, [k]: v }));
  }

  const hasFilters = !!(filters.search || filters.city || filters.category);

  return (
    <div className="min-h-screen bg-[#f3fcf3]">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006b2d]">Directorio</p>
          <h1 className="mt-1 text-3xl font-black text-[#151d18]">Escuelas artísticas</h1>
          <p className="mt-2 text-sm leading-6 text-[#5f6d61]">
            Busca por nombre, ciudad o disciplina y encuentra la escuela ideal.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-2xl border border-[#dfeadf] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="search-schools" className="mb-1.5 block text-xs font-semibold text-[#5f6d61]">Buscar</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aab9c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                </svg>
                <input
                  id="search-schools"
                  type="text"
                  placeholder="Nombre o ciudad..."
                  value={filters.search}
                  onChange={(e) => setFilter('search', e.target.value)}
                  className="w-full rounded-xl border border-[#dce8dc] bg-[#f9fdf9] py-2.5 pl-9 pr-4 text-sm text-[#151d18] placeholder:text-[#9aab9c] focus:border-[#006b2d] focus:outline-none focus:ring-2 focus:ring-[#006b2d]/20"
                />
              </div>
            </div>
            <div>
              <label htmlFor="filter-city" className="mb-1.5 block text-xs font-semibold text-[#5f6d61]">Ciudad</label>
              <input
                id="filter-city"
                type="text"
                placeholder="Ej. Madrid"
                value={filters.city}
                onChange={(e) => setFilter('city', e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label htmlFor="filter-category" className="mb-1.5 block text-xs font-semibold text-[#5f6d61]">Disciplina</label>
              <select
                id="filter-category"
                value={filters.category}
                onChange={(e) => setFilter('category', e.target.value)}
                className={inputClass()}
              >
                <option value="">Todas</option>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <EmptyState
            title="Error al cargar"
            description={error}
          >
            <button
              onClick={() => setFilters({ ...filters })}
              className="inline-flex items-center gap-1 rounded-xl border border-[#dce8dc] bg-white px-4 py-2 text-sm font-semibold text-[#006b2d] transition hover:bg-[#e8f5ec]"
            >
              Reintentar
            </button>
          </EmptyState>
        ) : schools.length ? (
          <>
            <p className="mb-5 text-sm text-[#5f6d61]">
              <strong className="text-[#151d18]">{schools.length}</strong> escuela{schools.length !== 1 ? 's' : ''} encontrada{schools.length !== 1 ? 's' : ''}
              {hasFilters && <span> · <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-[#006b2d] hover:underline">Limpiar filtros</button></span>}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {schools.map((school, i) => (
                <article
                  key={school.id}
                  className="group overflow-hidden rounded-2xl border border-[#dfeadf] bg-white shadow-sm transition hover:shadow-[0_8px_28px_rgba(29,65,35,0.12)] hover:-translate-y-0.5"
                >
                  {/* Cover */}
                  <div className="relative h-44 overflow-hidden bg-[#eaf3ea]">
                    {school.coverImageUrl || school.profileImageUrl ? (
                      <img
                        src={school.coverImageUrl || school.profileImageUrl!}
                        alt={`Portada de ${school.name}`}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_COVERS[i % FALLBACK_COVERS.length]; }}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8f5ec] to-[#d4edda]">
                        <svg className="h-12 w-12 text-[#a3d9b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden="true" />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <Badge variant="default" className="bg-white/90 text-[#151d18] backdrop-blur-sm">
                        {CATEGORY_LABELS[school.category] ?? school.category}
                      </Badge>
                      {school.isVerified && (
                        <Badge variant="success" className="bg-[#006b2d]/90 text-white backdrop-blur-sm">Verificada</Badge>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <h3 className="text-base font-black text-[#151d18] line-clamp-1">{school.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#5f6d61]">
                      <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {school.city || 'Sin ubicación'}
                    </p>
                    {school.description && (
                      <p className="mt-2 text-xs leading-5 text-[#5f6d61] line-clamp-2">{school.description}</p>
                    )}
                    <Link
                      to={`/schools/${school.id}`}
                      className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-xl border border-[#dce8dc] bg-white text-sm font-bold text-[#253429] transition hover:border-[#006b2d] hover:bg-[#f3fcf3] hover:text-[#006b2d]"
                    >
                      Ver escuela
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={hasFilters ? 'Sin resultados para estos filtros' : 'Aún no hay escuelas publicadas'}
            description={
              hasFilters
                ? 'Prueba con otros términos o limpia los filtros para ver todas las escuelas.'
                : 'Cuando se registren escuelas aparecerán aquí.'
            }
          >
            {hasFilters && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="inline-flex items-center gap-1 rounded-xl bg-[#006b2d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#005723]"
              >
                Ver todas las escuelas
              </button>
            )}
          </EmptyState>
        )}
      </section>
    </div>
  );
}
