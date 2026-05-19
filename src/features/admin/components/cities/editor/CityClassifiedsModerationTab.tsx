import { getTranslations } from 'next-intl/server'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'
import { listCityClassifiedsForAdmin } from '@/features/admin/server/cities.server'
import { FilterChipsCommon } from './FilterChipsCommon'
import { Pagination } from './Pagination'
import { RowStatusActions } from './RowStatusActions'

interface Props {
  city: AdminCityDetail
  statusFilter: string
  page: number
}

type Status = 'open' | 'sold' | 'closed'

const ALL_STATUSES: Status[] = ['open', 'sold', 'closed']

export async function CityClassifiedsModerationTab({ city, statusFilter, page }: Props) {
  const t = await getTranslations('admin.ciudades')
  const status = ALL_STATUSES.includes(statusFilter as Status)
    ? (statusFilter as Status)
    : undefined
  const { items, total, pageSize } = await listCityClassifiedsForAdmin(city.id, {
    status,
    page,
    pageSize: 20,
  })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const statusPillClass: Record<Status, string> = {
    open: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    sold: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    closed: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  }
  const statusLabel: Record<Status, string> = {
    open: t('statusOpen'),
    sold: t('statusSold'),
    closed: t('statusClosed'),
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('classifiedsHeading')}
        </h2>
        <FilterChipsCommon<Status>
          items={[
            { id: undefined, key: 'classifiedsFilterAll' },
            { id: 'open', key: 'classifiedsFilterOpen' },
            { id: 'sold', key: 'classifiedsFilterSold' },
            { id: 'closed', key: 'classifiedsFilterClosed' },
          ]}
          basePath={`/admin/ciudades/${city.slug}`}
          tab="classifieds"
          active={status}
          namespace="admin.ciudades"
        />
      </header>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800">
          {t('classifiedsEmpty')}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {items.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {c.title}
                </div>
                <div className="text-xs text-neutral-500">
                  {c.authorName ?? t('anonymousUser')} · {c.kind} ·{' '}
                  {new Date(c.createdAt).toLocaleDateString('es-ES')}
                  {c.priceCents != null
                    ? ` · ${(c.priceCents / 100).toLocaleString('es-ES')} ${c.currency}`
                    : ''}
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusPillClass[c.status]}`}
              >
                {statusLabel[c.status]}
              </span>
              <RowStatusActions
                kind="classified"
                rowId={c.id}
                actions={[
                  { label: t('classifiedsMarkSold'), status: 'sold', intent: 'primary' },
                  { label: t('classifiedsClose'), status: 'closed', intent: 'neutral' },
                  { label: t('classifiedsReopen'), status: 'open', intent: 'neutral' },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <Pagination
          baseHref={`/admin/ciudades/${city.slug}?tab=classifieds${status ? `&status=${status}` : ''}`}
          page={page}
          totalPages={totalPages}
          previousLabel={t('previous')}
          nextLabel={t('next')}
          pageOfLabel={t('pageOf', { page, totalPages })}
        />
      )}
    </section>
  )
}
