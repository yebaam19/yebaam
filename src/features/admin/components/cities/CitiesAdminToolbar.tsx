import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import type { CountryOption } from '@/features/admin/server/cities.server'

interface Props {
  search: string
  countryCode: string
  countries: CountryOption[]
}

/**
 * Search + country filter for /admin/ciudades. Plain HTML form `method="get"`
 * — the page reads `searchParams` and re-fetches. No client JS needed.
 */
export async function CitiesAdminToolbar({ search, countryCode, countries }: Props) {
  const t = await getTranslations('admin.ciudades')
  const hasFilters = Boolean(search || countryCode)
  return (
    <form
      action="/admin/ciudades"
      method="get"
      className="flex flex-col gap-2 border-b border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder={t('searchPlaceholder')}
          className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm sm:max-w-xs dark:border-neutral-700 dark:bg-neutral-950"
        />
        <select
          name="country"
          defaultValue={countryCode}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="">{t('allCountries')}</option>
          {countries.map((c) => (
            <option key={c.id} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500"
        >
          {t('search')}
        </button>
        {hasFilters && (
          <Link
            href={'/admin/ciudades' as Route}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {t('clear')}
          </Link>
        )}
      </div>
    </form>
  )
}
