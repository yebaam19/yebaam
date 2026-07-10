import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Store } from 'lucide-react'
import { listBusinesses } from '@/features/comidas/server/business.server'
import { getFollowedBusinesses } from '@/features/comidas/server/engagement.server'
import { getAuthUser } from '@/features/auth/actions/auth.actions'
import { NegociosList } from '@/features/comidas/components/public/NegociosList'
import { HeroSection } from '@/features/comidas/components/public/HeroSection'

export const metadata: Metadata = {
  title: 'Negocios | Yebaam',
  description: 'Descubre y sigue negocios de tu comunidad. Recibe sus novedades en tu feed.',
}

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function NegociosPage({ searchParams }: PageProps) {
  const { q } = await searchParams

  const [{ data: businesses, count }, user] = await Promise.all([
    listBusinesses({ limit: 100, search: q || undefined }),
    getAuthUser().catch(() => null),
  ])

  const followedIds = user
    ? new Set((await getFollowedBusinesses()).map((b) => b.id))
    : new Set<string>()

  const total = count ?? businesses.length

  return (
    <>
      {/* ── Sticky header — regreso a la plataforma Yebaam ────── */}
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
                <Store size={15} className="text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold text-neutral-900">Negocios</span>
            </div>
          </div>

          {user && (
            <Link
              href="/negocios/crear"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              + Registrar negocio
            </Link>
          )}
        </div>
      </header>

      {/* ── Hero (sin búsqueda duplicada) ─────────────────────── */}
      <HeroSection
        stats={{
          businesses: total,
          dishes: businesses.reduce((acc, b) => acc + (b.review_count ?? 0), 0),
          interactions: total * 8,
        }}
      />

      {/* ── Listado — filtro iniciado desde ?q= del Hero ─────── */}
      <NegociosList
        businesses={businesses}
        totalCount={total}
        initialQuery={q ?? ''}
        isAuthenticated={!!user}
        followedIds={followedIds}
      />
    </>
  )
}
