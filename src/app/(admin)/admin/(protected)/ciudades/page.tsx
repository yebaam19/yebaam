import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { listAdminCities } from '@/features/admin/server/cities.server'
import { CitiesAdminToolbar } from '@/features/admin/components/cities/CitiesAdminToolbar'
import { CitiesAdminTable } from '@/features/admin/components/cities/CitiesAdminTable'

export const metadata = { title: 'Admin · Ciudades' }

interface PageProps {
  searchParams: Promise<{ q?: string; country?: string; page?: string }>
}

export default async function AdminCitiesPage({ searchParams }: PageProps) {
  await requirePlatformAdmin()
  const sp = await searchParams
  const search = sp.q?.trim() ?? ''
  const countryCode = sp.country?.trim() ?? ''
  const page = Math.max(1, Number(sp.page) || 1)
  const pageSize = 25

  const t = await getTranslations('admin.ciudades')
  const { items, total, countries } = await listAdminCities({
    search,
    countryCode,
    page,
    pageSize,
  })

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const buildHref = (nextPage: number): Route => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (countryCode) params.set('country', countryCode)
    if (nextPage > 1) params.set('page', String(nextPage))
    const qs = params.toString()
    return (qs ? `/admin/ciudades?${qs}` : '/admin/ciudades') as Route
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {t('title')}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {t('totalCities', { count: total.toLocaleString('es-ES') })}
          </span>
          <Link
            href={'/admin/ciudades/thumbnails' as Route}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t('manageThumbnails')}
          </Link>
          <Link
            href={'/admin/ciudades/new' as Route}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500"
          >
            {t('newCity')}
          </Link>
        </div>
      </header>

      <section className="min-w-0 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <CitiesAdminToolbar
          search={search}
          countryCode={countryCode}
          countries={countries}
        />
        <CitiesAdminTable
          items={items}
          search={search}
          page={page}
          totalPages={totalPages}
          buildHref={buildHref}
        />
      </section>
    </div>
  )
}
