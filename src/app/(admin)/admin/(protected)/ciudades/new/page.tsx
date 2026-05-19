import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { listCountryOptions } from '@/features/admin/server/cities.server'
import { CityCreateForm } from '@/features/admin/components/cities/CityCreateForm'

export const metadata = { title: 'Admin · Nueva ciudad' }

export default async function AdminCityNewPage() {
  await requirePlatformAdmin()
  const t = await getTranslations('admin.ciudades')
  const countries = await listCountryOptions()

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href={'/admin/ciudades' as Route}
          className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
        >
          {t('back')}
        </Link>
      </div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {t('createTitle')}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('createSubtitle')}</p>
      </header>
      <section className="max-w-2xl rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <CityCreateForm countries={countries} />
      </section>
    </div>
  )
}
