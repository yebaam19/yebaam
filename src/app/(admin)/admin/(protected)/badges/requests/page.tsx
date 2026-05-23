import Link from 'next/link'
import type { Route } from 'next'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { listPendingBadgeRequests } from '@/features/admin/server/badges.server'
import { RequestsQueue } from '@/features/admin/components/badges/RequestsQueue'

export const metadata = { title: 'Admin · Solicitudes de insignias' }

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function BadgeRequestsPage({ searchParams }: PageProps) {
  await requirePlatformAdmin()
  const sp = await searchParams
  const status = (['pending', 'approved', 'rejected', 'withdrawn'] as const).includes(
    sp.status as never,
  )
    ? (sp.status as 'pending' | 'approved' | 'rejected' | 'withdrawn')
    : 'pending'

  const items = await listPendingBadgeRequests({ status })

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Solicitudes de insignias
          </h1>
          <p className="text-sm text-neutral-500">
            Revisa las solicitudes enviadas por los usuarios.
          </p>
        </div>
        <nav className="flex flex-wrap gap-1">
          {(
            [
              { v: 'pending', l: 'Pendientes' },
              { v: 'approved', l: 'Aprobadas' },
              { v: 'rejected', l: 'Rechazadas' },
              { v: 'withdrawn', l: 'Retiradas' },
            ] as const
          ).map((opt) => (
            <Link
              key={opt.v}
              href={
                opt.v === 'pending'
                  ? ('/admin/badges/requests' as Route)
                  : (`/admin/badges/requests?status=${opt.v}` as Route)
              }
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                status === opt.v
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {opt.l}
            </Link>
          ))}
        </nav>
      </header>
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <RequestsQueue requests={items} />
      </section>
    </div>
  )
}
