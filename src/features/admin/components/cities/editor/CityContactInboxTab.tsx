import { getTranslations } from 'next-intl/server'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'
import { listCityContactMessagesForAdmin } from '@/features/admin/server/cities.server'
import { FilterChipsCommon } from './FilterChipsCommon'
import { Pagination } from './Pagination'
import { RowStatusActions } from './RowStatusActions'

interface Props {
  city: AdminCityDetail
  statusFilter: string
  page: number
}

type Status = 'new' | 'read' | 'resolved'

const ALL_STATUSES: Status[] = ['new', 'read', 'resolved']

export async function CityContactInboxTab({ city, statusFilter, page }: Props) {
  const t = await getTranslations('admin.ciudades')
  const status = ALL_STATUSES.includes(statusFilter as Status)
    ? (statusFilter as Status)
    : undefined
  const { items, total, pageSize } = await listCityContactMessagesForAdmin(city.id, {
    status,
    page,
    pageSize: 20,
  })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const statusPillClass: Record<Status, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    read: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  }
  const statusLabel: Record<Status, string> = {
    new: t('statusNew'),
    read: t('statusRead'),
    resolved: t('statusResolved'),
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('contactHeading')}
        </h2>
        <FilterChipsCommon<Status>
          items={[
            { id: undefined, key: 'contactFilterAll' },
            { id: 'new', key: 'contactFilterNew' },
            { id: 'read', key: 'contactFilterRead' },
            { id: 'resolved', key: 'contactFilterResolved' },
          ]}
          basePath={`/admin/ciudades/${city.slug}`}
          tab="contact"
          active={status}
          namespace="admin.ciudades"
        />
      </header>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800">
          {t('contactEmpty')}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {items.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {m.subject ?? t('contactNoSubject')}
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
                  {m.body}
                </p>
                <div className="mt-1 text-xs text-neutral-500">
                  {m.senderName ?? t('anonymousUser')} ·{' '}
                  {new Date(m.createdAt).toLocaleString('es-ES')}
                </div>
              </div>
              <div className="flex flex-row items-start gap-2 sm:flex-col sm:items-end">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusPillClass[m.status]}`}
                >
                  {statusLabel[m.status]}
                </span>
                <RowStatusActions
                  kind="contact"
                  rowId={m.id}
                  actions={[
                    { label: t('contactMarkRead'), status: 'read', intent: 'neutral' },
                    { label: t('contactMarkResolved'), status: 'resolved', intent: 'primary' },
                    { label: t('contactReopen'), status: 'new', intent: 'neutral' },
                  ]}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <Pagination
          baseHref={`/admin/ciudades/${city.slug}?tab=contact${status ? `&status=${status}` : ''}`}
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
