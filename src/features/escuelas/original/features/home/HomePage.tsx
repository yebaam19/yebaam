import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import EmptyState from '../../components/ui/EmptyState';
import type { Campaign, Program, School } from '../../types';

const DISCIPLINES = [
  { label: 'Música',         icon: '🎵', query: 'MUSIC'   },
  { label: 'Danza',          icon: '💃', query: 'DANCE'   },
  { label: 'Teatro',         icon: '🎭', query: 'THEATER' },
  { label: 'Artes visuales', icon: '🎨', query: 'ARTS'    },
  { label: 'Multidisciplina',icon: '✨', query: 'MULTIDISCIPLINARY' },
];

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80',
];

interface HomeSchool extends Omit<School, 'programs' | 'campaigns'> {
  programs?: Program[];
  campaigns?: Campaign[];
}

function getSchoolImage(school: HomeSchool, index: number) {
  return school.coverImageUrl || school.profileImageUrl || FALLBACK_COVERS[index % FALLBACK_COVERS.length];
}

function getModalityLabel(programs?: Program[]) {
  if (!programs?.length) return 'Presencial';
  const modes = Array.from(new Set(programs.map((p) => p.modality)));
  if (modes.includes('HYBRID')) return 'Híbrida';
  if (modes.includes('VIRTUAL')) return 'Virtual';
  return 'Presencial';
}

function handleImgError(e: SyntheticEvent<HTMLImageElement>, fallback: string) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = fallback;
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-[#7a887b]">{label}</span>
      <span className="text-sm font-bold text-[#202b24]">{value}</span>
    </div>
  );
}

export default function HomePage() {
  const [schools, setSchools] = useState<HomeSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get<{ ok: boolean; data: { schools?: HomeSchool[] } }>('/home/catalog')
      .then((r) => setSchools(r.data.data.schools ?? []))
      .catch((err: { message?: string }) => setError(err.message || 'Error al cargar escuelas'))
      .finally(() => setLoading(false));
  }, []);

  const featured = useMemo(() => schools.slice(0, 3), [schools]);

  return (
    <main className="min-h-screen bg-[#f3fcf3] text-[#151d18]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-[#e8f5ec] opacity-60 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[#d4edda] opacity-40 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-14 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dce8dc] bg-white px-4 py-1.5 text-xs font-semibold text-[#006b2d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#006b2d]" aria-hidden="true" />
              Directorio de escuelas artísticas
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.06] tracking-tight text-[#111811] sm:text-5xl lg:text-6xl">
              Descubre el lugar donde tu talento florece
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#5f6d61] sm:text-base">
              Conecta con escuelas de música, danza, teatro y artes visuales. Encuentra docentes apasionados, programas pensados para ti y clases de prueba gratuitas.
            </p>
          </div>

          {/* Search */}
          <div className="mx-auto mt-8 flex max-w-2xl items-center overflow-hidden rounded-xl border border-[#dce8dc] bg-white shadow-[0_8px_32px_rgba(29,65,35,0.10)]">
            <label className="flex flex-1 items-center gap-3 pl-4 pr-2">
              <svg className="h-5 w-5 shrink-0 text-[#7a887b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <span className="sr-only">Buscar escuelas, cursos o docentes</span>
              <input
                className="h-12 w-full border-none bg-transparent text-sm text-[#151d18] outline-none placeholder:text-[#9aab9c]"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && search.trim()) {
                    window.location.href = `/schools?search=${encodeURIComponent(search)}`;
                  }
                }}
                placeholder="Escuelas, cursos, disciplinas, ciudad..."
              />
            </label>
            <Link
              to={search ? `/schools?search=${encodeURIComponent(search)}` : '/schools'}
              className="m-1.5 inline-flex h-10 items-center justify-center rounded-lg bg-[#006b2d] px-5 text-sm font-bold text-white transition hover:bg-[#005723]"
            >
              Buscar
            </Link>
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/schools"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#006b2d] px-8 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,107,45,0.22)] transition hover:bg-[#005723]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Explorar escuelas
            </Link>
            <Link
              to="/programs"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dce8dc] bg-white px-8 text-sm font-bold text-[#253429] transition hover:border-[#006b2d] hover:text-[#006b2d]"
            >
              Ver todos los cursos
            </Link>
          </div>

          {/* Discipline pills */}
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2">
            {DISCIPLINES.map(({ label, icon, query }) => (
              <Link
                key={query}
                to={`/schools?category=${query}`}
                className="flex items-center gap-2 rounded-full border border-[#dfeadf] bg-white px-4 py-2 text-xs font-semibold text-[#425146] transition hover:border-[#006b2d] hover:bg-[#e8f5ec] hover:text-[#006b2d]"
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured schools ── */}
      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006b2d]">Destacadas</p>
            <h2 className="mt-1 text-2xl font-black text-[#151d18] sm:text-3xl">Escuelas verificadas</h2>
            <p className="mt-1.5 text-sm text-[#5f6d61]">Perfiles completos con programas activos y comunidad real.</p>
          </div>
          <Link
            to="/schools"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#006b2d] transition hover:text-[#005723]"
          >
            Ver todas
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-[#dfeadf] bg-white" aria-hidden="true">
                <div className="h-48 w-full animate-pulse bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/4 animate-pulse rounded-lg bg-slate-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-200" />
                  <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="No se pudieron cargar las escuelas"
            description="Verifica tu conexión e intenta nuevamente."
          >
            <Link to="/schools" className="inline-flex items-center gap-1 text-sm font-semibold text-[#006b2d] hover:underline">
              Ver listado completo →
            </Link>
          </EmptyState>
        ) : featured.length ? (
          <div className="grid gap-5 md:grid-cols-3">
            {featured.map((school, i) => {
              const modality = getModalityLabel(school.programs);
              const programCount = school.programs?.length ?? 0;

              return (
                <article
                  key={school.id}
                  className="group overflow-hidden rounded-2xl border border-[#dfeadf] bg-white shadow-sm transition hover:shadow-[0_8px_28px_rgba(29,65,35,0.13)] hover:-translate-y-0.5"
                >
                  {/* Cover image */}
                  <div className="relative h-48 overflow-hidden bg-[#eaf3ea]">
                    <img
                      src={getSchoolImage(school, i)}
                      alt={`Portada de ${school.name}`}
                      loading="lazy"
                      onError={(e) => handleImgError(e, FALLBACK_COVERS[i % FALLBACK_COVERS.length])}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" aria-hidden="true" />

                    {/* Category badge */}
                    {school.category && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-[#151d18] backdrop-blur-sm">
                        {school.category === 'MUSIC' ? 'Música'
                          : school.category === 'DANCE' ? 'Danza'
                          : school.category === 'THEATER' ? 'Teatro'
                          : school.category === 'ARTS' ? 'Artes visuales'
                          : 'Multidisciplina'}
                      </span>
                    )}

                    {school.isVerified && (
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#006b2d] px-2.5 py-0.5 text-xs font-bold text-white">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verificada
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <h3 className="text-lg font-black leading-tight text-[#151d18] line-clamp-2">{school.name}</h3>
                    <p className="mt-1.5 flex items-center gap-1 text-sm text-[#5f6d61]">
                      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {school.city || 'Sin ubicación'}
                    </p>

                    <div className="mt-4 flex items-center gap-5 border-t border-[#f0f6f0] pt-4">
                      <StatPill label="Modalidad" value={modality} />
                      <StatPill label="Programas" value={programCount || '—'} />
                    </div>

                    <Link
                      to={`/schools/${school.id}`}
                      className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-xl border border-[#dce8dc] bg-white text-sm font-bold text-[#253429] transition hover:border-[#006b2d] hover:text-[#006b2d]"
                    >
                      Ver perfil completo
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Aún no hay escuelas publicadas"
            description="Sé el primero en registrar tu escuela en el directorio."
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#006b2d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#005723]"
            >
              Registrar mi escuela
            </Link>
          </EmptyState>
        )}
      </section>

      {/* ── Value props ── */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                title: 'Programas reales',
                description: 'Información actualizada por las propias escuelas: horarios, precios, niveles y modalidad.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                title: 'Escuelas verificadas',
                description: 'Cada perfil pasa por un proceso de verificación para garantizar seriedad e información auténtica.',
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: 'Contacto directo',
                description: 'Solicita información y clases de prueba directamente con la escuela, sin intermediarios.',
              },
            ].map(({ icon, title, description }) => (
              <div key={title} className="flex flex-col items-start gap-4 rounded-2xl border border-[#dfeadf] bg-[#f9fdf9] p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f5ec] text-[#006b2d]">
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-[#151d18]">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#5f6d61]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-[#006b2d] px-8 py-10 shadow-[0_12px_48px_rgba(0,107,45,0.25)] sm:px-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#a3d9b3]">Para escuelas</p>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                ¿Tienes una escuela artística?
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-[#c8ecd2]">
                Crea tu perfil gratuito, publica tus programas, conecta con futuros alumnos y gestiona todo desde un único panel.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#a3d9b3]">
                {['Perfil público verificado', 'Gestión de leads', 'Clases de prueba', 'Galería de medios'].map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to="/register"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white px-10 text-base font-black text-[#006b2d] transition hover:bg-[#f3fcf3]"
            >
              Crear perfil ahora
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
