import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, Settings } from 'lucide-react'
import { listSchools, getMySchools } from '@/features/escuelas/server/school.server'
import { getAuthUser } from '@/features/auth/actions/auth.actions'
import { EscuelasList } from '@/features/escuelas/components/public/EscuelasList'

export const metadata: Metadata = {
  title: 'Escuelas de Artes | Yebaam',
  description: 'Encuentra escuelas de música, danza, teatro y más cerca de ti.',
}

interface PageProps {
  searchParams: Promise<{ q?: string; city?: string; category?: string }>
}

export default async function EscuelasPage({ searchParams }: PageProps) {
  const { q, city, category } = await searchParams

  const [{ data: schools, count }, user, mySchools] = await Promise.all([
    listSchools({ limit: 100, search: q || undefined, city: city || undefined, category: category as never || undefined }),
    getAuthUser().catch(() => null),
    getMySchools().catch(() => []),
  ])

  const total = count ?? schools.length

  return (
    <>
      {/* Sticky header with back navigation to Yebaam */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Volver a Yebaam</span>
              <span className="sm:hidden">Yebaam</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-700">
                <GraduationCap size={15} className="text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold text-neutral-900">Escuelas</span>
            </div>
          </div>

          {user && (
            <Link
              href="/escuelas/crear"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              + Registrar escuela
            </Link>
          )}
        </div>
      </header>

      {/* Mis escuelas — only shown to users who administer at least one school */}
      {mySchools.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-neutral-500">Mis escuelas</h2>
          <div className="flex flex-wrap gap-3">
            {mySchools.map((s) => (
              <Link
                key={s.id}
                href={`/escuelas/admin/${s.id}` as never}
                className="inline-flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                <Settings size={14} aria-hidden="true" className="text-neutral-400" />
                {s.name}
              </Link>
            ))}
          </div>
          <div className="mt-4 border-b border-neutral-100" />
        </section>
      )}

      <EscuelasList
        schools={schools}
        totalCount={total}
        initialQuery={q ?? ''}
        initialCity={city ?? ''}
        initialCategory={category ?? ''}
      />
    </>
  )
}
