import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrograms, type ProgramFilters } from '../../hooks/usePrograms';
import Card from '../../components/ui/Card';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';

const MODALITY_LABELS: Record<string, string> = {
  PRESENTIAL: 'Presencial',
  VIRTUAL: 'Virtual',
  HYBRID: 'Híbrido',
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Inicial',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
  PROFESSIONAL: 'Profesional',
};

const LEVEL_BADGE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  BEGINNER: 'success',
  INTERMEDIATE: 'info',
  ADVANCED: 'warning',
  PROFESSIONAL: 'danger',
};

const INITIAL_FILTERS: ProgramFilters = { page: 1, limit: 12 };

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);
  if (currentPage > 2) pages.add(currentPage - 1);
  if (currentPage < totalPages - 1) pages.add(currentPage + 1);
  return Array.from(pages).sort((a, b) => a - b);
}

export default function ProgramsPage() {
  const [filters, setFilters] = useState<ProgramFilters>(INITIAL_FILTERS);
  const { result, loading, error } = usePrograms(filters);

  function setFilter<K extends keyof ProgramFilters>(key: K, value: ProgramFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function setPage(page: number) {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const showingFrom = result?.total ? (result.page - 1) * result.limit + 1 : 0;
  const showingTo = result ? Math.min(result.page * result.limit, result.total) : 0;
  const visiblePages = result ? getVisiblePages(result.page, result.totalPages) : [];

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <SectionHeader title="Programas" subtitle="Explora cursos, talleres y clases de todas las disciplinas.">
        <span className="text-sm text-slate-500">
          {result ? `${result.total} resultado${result.total !== 1 ? 's' : ''}` : ''}
        </span>
      </SectionHeader>

      {/* Filtros */}
      <div className="mb-8 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={filters.search ?? ''}
          onChange={(e) => setFilter('search', e.target.value || undefined)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none sm:w-72"
        />
        <select
          value={filters.modality ?? ''}
          onChange={(e) => setFilter('modality', e.target.value || undefined)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none"
        >
          <option value="">Modalidad</option>
          <option value="PRESENTIAL">Presencial</option>
          <option value="VIRTUAL">Virtual</option>
          <option value="HYBRID">Híbrido</option>
        </select>
        <select
          value={filters.level ?? ''}
          onChange={(e) => setFilter('level', e.target.value || undefined)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none"
        >
          <option value="">Nivel</option>
          <option value="BEGINNER">Inicial</option>
          <option value="INTERMEDIATE">Intermedio</option>
          <option value="ADVANCED">Avanzado</option>
          <option value="PROFESSIONAL">Profesional</option>
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.trialClassAvailable === true}
            onChange={(e) => setFilter('trialClassAvailable', e.target.checked ? true : undefined)}
            className="accent-[#006b2d]"
          />
          Clase de prueba
        </label>
        {(filters.modality || filters.level || filters.trialClassAvailable || filters.search) && (
          <button
            onClick={() => setFilters(INITIAL_FILTERS)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <EmptyState title="Error al cargar" description={error} />
      ) : !result?.data.length ? (
        <EmptyState title="Sin resultados" description="Prueba con otros filtros o términos de búsqueda." />
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">
            Mostrando {showingFrom}-{showingTo} de {result.total} programas
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {result.data.map((program) => (
              <Link key={program.id} to={`/programs/${program.id}`} className="group block">
                <Card className="h-full transition hover:shadow-md hover:border-[#006b2d]/30">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">{MODALITY_LABELS[program.modality] ?? program.modality}</Badge>
                    <Badge variant={LEVEL_BADGE[program.level] ?? 'default'}>
                      {LEVEL_LABELS[program.level] ?? program.level}
                    </Badge>
                    {program.trialClassAvailable && (
                      <Badge variant="success">Clase de prueba</Badge>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold group-hover:text-[#006b2d]">{program.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{program.school.name} · {program.discipline.name}</p>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{program.shortDescription}</p>
                  <p className="mt-4 text-sm font-bold text-[#006b2d]">
                    {program.monthlyPrice} {program.currency}<span className="font-normal text-slate-400">/mes</span>
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {/* Paginación */}
          {result.totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  disabled={result.page <= 1}
                  onClick={() => setPage(result.page - 1)}
                  className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium disabled:opacity-40 hover:bg-slate-50"
                >
                  ← Anterior
                </button>

                {visiblePages.map((page, index) => {
                  const previous = visiblePages[index - 1];
                  const showGap = previous !== undefined && page - previous > 1;
                  return (
                    <span key={page} className="flex items-center gap-2">
                      {showGap && <span className="text-sm text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setPage(page)}
                        aria-current={page === result.page ? 'page' : undefined}
                        className={`h-9 min-w-9 rounded-full px-3 text-sm font-semibold transition ${
                          page === result.page
                            ? 'bg-[#006b2d] text-white'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}

                <button
                  disabled={result.page >= result.totalPages}
                  onClick={() => setPage(result.page + 1)}
                  className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium disabled:opacity-40 hover:bg-slate-50"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
