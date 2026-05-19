import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import type { AdminCityRow } from '@/features/admin/server/cities.server'

interface Props {
  items: AdminCityRow[]
  search: string
  page: number
  totalPages: number
  buildHref: (page: number) => Route
}

export async function CitiesAdminTable({ items, search, page, totalPages, buildHref }: Props) {
  const t = await getTranslations('admin.ciudades')
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-170 text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
              <th className="px-4 py-2">{t('columnCity')}</th>
              <th className="px-4 py-2">{t('columnCountry')}</th>
              <th className="px-4 py-2 text-right">{t('columnFollowers')}</th>
              <th className="px-4 py-2 text-right">{t('columnBusinesses')}</th>
              <th className="px-4 py-2 text-right">{t('columnNews')}</th>
              <th className="px-4 py-2 text-right">{t('columnClassifieds')}</th>
              <th className="px-4 py-2 text-center">{t('columnFeatured')}</th>
              <th className="px-4 py-2 text-right">{t('columnActions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-neutral-500">
                  {search ? t('emptyNoResults') : t('emptyNoCities')}
                </td>
              </tr>
            ) : (
              items.map((c) => <Row key={c.id} city={c} editLabel={t('edit')} featuredPill={t('featuredPill')} />)
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav
          aria-label={t('paginationLabel')}
          className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-xs text-neutral-500 dark:border-neutral-800"
        >
          <span>{t('pageOf', { page, totalPages })}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref(page - 1)}
                className="rounded-md border border-neutral-300 px-3 py-1 font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t('previous')}
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref(page + 1)}
                className="rounded-md border border-neutral-300 px-3 py-1 font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {t('next')}
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  )
}

function Row({
  city,
  editLabel,
  featuredPill,
}: {
  city: AdminCityRow
  editLabel: string
  featuredPill: string
}) {
  return (
    <tr className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60 dark:border-neutral-800 dark:hover:bg-neutral-800/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800">
            {city.coverImageUrl ? (
              <Image
                src={city.coverImageUrl}
                alt=""
                width={56}
                height={40}
                unoptimized
                className="h-10 w-14 object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium text-neutral-900 dark:text-neutral-100">{city.name}</div>
            <div className="text-xs text-neutral-500">/{city.slug}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-neutral-500">{city.country?.name ?? '—'}</td>
      <td className="px-4 py-3 text-right text-neutral-700 tabular-nums dark:text-neutral-200">
        {city.followerCount.toLocaleString('es-ES')}
      </td>
      <td className="px-4 py-3 text-right text-neutral-700 tabular-nums dark:text-neutral-200">
        {city.businessesCount.toLocaleString('es-ES')}
      </td>
      <td className="px-4 py-3 text-right text-neutral-700 tabular-nums dark:text-neutral-200">
        {city.newsCount.toLocaleString('es-ES')}
      </td>
      <td className="px-4 py-3 text-right text-neutral-700 tabular-nums dark:text-neutral-200">
        {city.classifiedsCount.toLocaleString('es-ES')}
      </td>
      <td className="px-4 py-3 text-center">
        {city.isFeatured ? (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {featuredPill}
          </span>
        ) : (
          <span className="text-neutral-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <Link
          href={`/admin/ciudades/${city.slug}` as Route}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {editLabel}
        </Link>
      </td>
    </tr>
  )
}
