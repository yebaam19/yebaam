import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import {
  getAdminCityBySlug,
  listCityAdmins,
} from '@/features/admin/server/cities.server'
import { CityEditView } from '@/features/admin/components/cities/CityEditView'

export const metadata = { title: 'Admin · Editar ciudad' }

type TabId =
  | 'metadata'
  | 'images'
  | 'admins'
  | 'features'
  | 'places'
  | 'media'
  | 'promotions'
  | 'news'
  | 'classifieds'
  | 'emprendimientos'
  | 'contact'
  | 'complaints'

const TABS = new Set<TabId>([
  'metadata',
  'images',
  'admins',
  'features',
  'places',
  'media',
  'promotions',
  'news',
  'classifieds',
  'emprendimientos',
  'contact',
  'complaints',
])

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string; status?: string; page?: string }>
}

export default async function AdminCityEditPage({ params, searchParams }: PageProps) {
  await requirePlatformAdmin()
  const { slug } = await params
  const sp = await searchParams
  const tab: TabId = TABS.has(sp.tab as TabId) ? (sp.tab as TabId) : 'metadata'
  const t = await getTranslations('admin.ciudades')

  const city = await getAdminCityBySlug(slug)
  if (!city) notFound()

  const admins = await listCityAdmins(city.id)

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={'/admin/ciudades' as Route}
          className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
        >
          {t('back')}
        </Link>
        <Link
          href={`/cities/${city.slug}` as `/${string}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          /cities/{city.slug}
        </Link>
      </div>
      <header className="mb-6 flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{city.name}</h1>
        {city.country?.name && (
          <span className="text-sm text-neutral-500">{city.country.name}</span>
        )}
        {city.is_featured && (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {t('featuredPill')}
          </span>
        )}
      </header>

      <CityEditView
        city={city}
        admins={admins}
        activeTab={tab}
        statusFilter={sp.status ?? ''}
        page={Math.max(1, Number(sp.page) || 1)}
      />
    </div>
  )
}
