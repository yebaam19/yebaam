import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { getAdminBadgeBySlug } from '@/features/admin/server/badges.server'
import { BadgeForm } from '@/features/admin/components/badges/BadgeForm'
import { GrantsList } from '@/features/admin/components/badges/GrantsList'
import { AuditLogTable } from '@/features/admin/components/badges/AuditLogTable'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  return { title: `Admin · ${slug}` }
}

export default async function EditBadgePage({ params }: PageProps) {
  await requirePlatformAdmin()
  const { slug } = await params
  const badge = await getAdminBadgeBySlug(slug)
  if (!badge) notFound()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-3 text-xs text-neutral-500">
        <Link href={'/admin/badges' as Route} className="hover:underline">
          ← Insignias
        </Link>
      </nav>
      <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{badge.name}</h1>
          <p className="text-xs text-neutral-500">
            /{badge.slug} · {badge.slot} · {badge.category}
            {badge.isSystem && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Sistema</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/badges/${badge.slug}/grant` as Route}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500"
          >
            Asignar a un usuario
          </Link>
          <Link
            href={`/insignias/${badge.slug}` as Route}
            target="_blank"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
          >
            Vista pública
          </Link>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            Metadatos
          </h2>
          <BadgeForm mode="edit" initial={badge} />
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="border-b border-neutral-200 px-3 py-2 text-sm font-semibold dark:border-neutral-800">
            Resumen
          </h2>
          <ul className="divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
            <li className="flex justify-between px-3 py-2">
              <span className="text-neutral-500">Asignaciones activas</span>
              <span className="font-semibold tabular-nums">{badge.grantCount}</span>
            </li>
            <li className="flex justify-between px-3 py-2">
              <span className="text-neutral-500">Solicitudes pendientes</span>
              <span className="font-semibold tabular-nums">{badge.pendingRequestCount}</span>
            </li>
            <li className="flex justify-between px-3 py-2">
              <span className="text-neutral-500">Solicitable</span>
              <span>{badge.requestable ? 'Sí' : 'No'}</span>
            </li>
            <li className="flex justify-between px-3 py-2">
              <span className="text-neutral-500">Visibilidad</span>
              <span>{badge.visibility === 'public' ? 'Pública' : 'Privada'}</span>
            </li>
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="border-b border-neutral-200 px-3 py-2 text-sm font-semibold dark:border-neutral-800">
          Asignaciones
        </h2>
        <Suspense fallback={<p className="px-3 py-6 text-center text-sm text-neutral-500">Cargando…</p>}>
          <GrantsList badgeId={badge.id} />
        </Suspense>
      </section>

      <section className="mt-6 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="border-b border-neutral-200 px-3 py-2 text-sm font-semibold dark:border-neutral-800">
          Historial de cambios
        </h2>
        <Suspense fallback={<p className="px-3 py-6 text-center text-sm text-neutral-500">Cargando…</p>}>
          <AuditLogTable badgeId={badge.id} />
        </Suspense>
      </section>
    </div>
  )
}
