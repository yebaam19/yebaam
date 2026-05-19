import { getTranslations } from 'next-intl/server'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'
import { listCityNewsForAdmin } from '@/features/admin/server/cities.server'
import { FilterChipsCommon } from './FilterChipsCommon'
import { Pagination } from './Pagination'
import { RowStatusActions } from './RowStatusActions'

interface Props {
  city: AdminCityDetail
  statusFilter: string
  page: number
}

type Status = 'pending' | 'approved' | 'rejected'

const ALL_STATUSES: Status[] = ['pending', 'approved', 'rejected']

export async function CityNewsModerationTab({ city, statusFilter, page }: Props) {
  const t = await getTranslations('admin.ciudades')
  const status = ALL_STATUSES.includes(statusFilter as Status)
    ? (statusFilter as Status)
    : undefined
  const { items, total, pageSize } = await listCityNewsForAdmin(city.id, {
    status,
    page,
    pageSize: 20,
  })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const statusPillClass: Record<Status, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  }
  const statusLabel: Record<Status, string> = {
    pending: t('statusPending'),
    approved: t('statusApproved'),
    rejected: t('statusRejected'),
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('newsHeading')}
        </h2>
        <FilterChipsCommon<Status>
          items={[
            { id: undefined, key: 'newsFilterAll' },
            { id: 'pending', key: 'newsFilterPending' },
            { id: 'approved', key: 'newsFilterApproved' },
            { id: 'rejected', key: 'newsFilterRejected' },
          ]}
          basePath={`/admin/ciudades/${city.slug}`}
          tab="news"
          active={status}
          namespace="admin.ciudades"
        />
      </header>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800">
          {t('newsEmpty')}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {items.map((n) => (
            <li key={n.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {n.title}
                </div>
                <div className="text-xs text-neutral-500">
                  {n.authorName ?? t('anonymousUser')} ·{' '}
                  {new Date(n.createdAt).toLocaleDateString('es-ES')}
                  {n.sourceName ? ` · ${n.sourceName}` : ''}
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusPillClass[n.status]}`}
              >
                {statusLabel[n.status]}
              </span>
              <RowStatusActions
                kind="news"
                rowId={n.id}
                actions={[
                  { label: t('newsApprove'), status: 'approved', intent: 'primary' },
                  { label: t('newsReject'), status: 'rejected', intent: 'danger' },
                  { label: t('newsResetPending'), status: 'pending', intent: 'neutral' },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <Pagination
          baseHref={`/admin/ciudades/${city.slug}?tab=news${status ? `&status=${status}` : ''}`}
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
