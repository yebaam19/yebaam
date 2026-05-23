import Link from 'next/link'
import type { Route } from 'next'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { listAdminBadges } from '@/features/admin/server/badges.server'
import { BadgesToolbar } from '@/features/admin/components/badges/BadgesToolbar'
import { BadgesAdminTable } from '@/features/admin/components/badges/BadgesAdminTable'

export const metadata = { title: 'Admin · Insignias' }

interface PageProps {
  searchParams: Promise<{
    q?: string
    slot?: string
    category?: string
    page?: string
    includeDeleted?: string
  }>
}

export default async function AdminBadgesPage({ searchParams }: PageProps) {
  await requirePlatformAdmin()
  const sp = await searchParams
  const search = sp.q?.trim() ?? ''
  const slot = sp.slot === 'insignia' || sp.slot === 'badge' ? sp.slot : undefined
  const category = sp.category?.trim() || undefined
  const page = Math.max(1, Number(sp.page) || 1)
  const pageSize = 25
  const includeDeleted = sp.includeDeleted === '1'

  const { items, total } = await listAdminBadges({ search, slot, category, page, pageSize, includeDeleted })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const buildHref = (nextPage: number): Route => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (slot) params.set('slot', slot)
    if (category) params.set('category', category)
    if (includeDeleted) params.set('includeDeleted', '1')
    if (nextPage > 1) params.set('page', String(nextPage))
    const qs = params.toString()
    return (qs ? `/admin/badges?${qs}` : '/admin/badges') as Route
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Insignias y badges</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Crea y asigna reconocimientos a perfiles. Las insignias aparecen junto al nombre del usuario; los badges en la franja debajo de la portada.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {total.toLocaleString('es-ES')} total
          </span>
          <Link
            href={'/admin/badges/requests' as Route}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Solicitudes pendientes
          </Link>
          <Link
            href={'/admin/badges/new' as Route}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500"
          >
            Nueva insignia
          </Link>
        </div>
      </header>

      <section className="min-w-0 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <BadgesToolbar search={search} slot={slot ?? ''} category={category ?? ''} includeDeleted={includeDeleted} />
        <BadgesAdminTable items={items} page={page} totalPages={totalPages} buildHref={buildHref} />
      </section>
    </div>
  )
}
