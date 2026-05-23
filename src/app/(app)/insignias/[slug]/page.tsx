import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { BadgeArt } from '@/features/badges/components/BadgeArt'

// Dynamic because getViewerBadgeStatus reads the caller's session via cookies().
// Marking explicitly so Turbopack doesn't try to pre-generate static paths.
export const dynamic = 'force-dynamic'

import {
  getPublicBadgeBySlug,
  getViewerBadgeStatus,
} from '@/features/badges/server/catalog.server'
import { RequestBadgeForm } from '@/features/badges/components/RequestBadgeForm'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const badge = await getPublicBadgeBySlug(slug)
  return { title: badge ? badge.name : 'Insignia' }
}

export default async function BadgeDetailPage({ params }: PageProps) {
  const { slug } = await params
  const badge = await getPublicBadgeBySlug(slug)
  if (!badge) notFound()
  const viewerStatus = await getViewerBadgeStatus(badge.id)

  return (
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6 lg:px-8">
      <nav className="mb-3 text-xs">
        <Link href={'/insignias' as Route} className="text-primary-600 hover:underline dark:text-primary-400">
          ← Reconocimientos
        </Link>
      </nav>
      <header className="mb-6 flex flex-wrap items-start gap-5">
        <BadgeArt
          size="detail"
          category={badge.category}
          tier={badge.tier}
          slug={badge.slug}
          iconUrl={badge.iconUrl}
          alt={badge.name}
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{badge.name}</h1>
          <p className="mt-1 text-xs text-neutral-500">
            {badge.slot === 'insignia' ? 'Insignia (junto al nombre)' : 'Badge (franja inferior)'} · {badge.category}
            {badge.tier ? ` · ${badge.tier}` : ''}
            {badge.isSystem && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Sistema
              </span>
            )}
          </p>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{badge.description}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {badge.grantCount.toLocaleString('es-ES')} usuarios la han recibido.
          </p>
        </div>
      </header>

      {badge.requirementsMd && (
        <section className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-neutral-500">Requisitos</h2>
          <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-700 dark:text-neutral-300">
            {badge.requirementsMd}
          </pre>
        </section>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {viewerStatus === 'holds' && (
          <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            Ya tienes esta {badge.slot === 'insignia' ? 'insignia' : 'badge'}.
          </div>
        )}
        {viewerStatus === 'pendingGrant' && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Tienes una asignación pendiente de aceptar. Visita tu perfil para confirmarla.
          </div>
        )}
        {viewerStatus === 'pendingRequest' && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Tu solicitud está en revisión.
          </div>
        )}
        {viewerStatus === 'none' &&
          (badge.requestable ? (
            <RequestBadgeForm badgeSlug={badge.slug} badgeName={badge.name} />
          ) : (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Esta {badge.slot === 'insignia' ? 'insignia' : 'badge'} solo se otorga por decisión administrativa.
            </p>
          ))}
      </section>
    </div>
  )
}
