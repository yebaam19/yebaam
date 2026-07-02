import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'
import { listCityEmprendimientosForAdmin } from '@/features/admin/server/cities.server'
import { FilterChipsCommon } from './FilterChipsCommon'
import { Pagination } from './Pagination'
import { EmprendimientoRowActions } from './EmprendimientoRowActions'

interface Props {
  city: AdminCityDetail
  statusFilter: string
  page: number
}

type Status = 'PENDING' | 'APPROVED' | 'REJECTED'

const ALL_STATUSES: Status[] = ['PENDING', 'APPROVED', 'REJECTED']

/** Review queue for emprendedores: approve → the row goes public with the
 *  "Emprendedor verificado" badge; reject → the owner sees the reason. */
export async function CityEmprendimientosModerationTab({ city, statusFilter, page }: Props) {
  const t = await getTranslations('admin.ciudades')
  const status = ALL_STATUSES.includes(statusFilter as Status)
    ? (statusFilter as Status)
    : undefined
  const { items, total, pageSize } = await listCityEmprendimientosForAdmin(city.id, {
    status,
    page,
    pageSize: 20,
  })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const statusPillClass: Record<Status, string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  }
  const statusLabel: Record<Status, string> = {
    PENDING: t('emprendimientosStatusPending'),
    APPROVED: t('emprendimientosStatusApproved'),
    REJECTED: t('emprendimientosStatusRejected'),
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('emprendimientosHeading')}
        </h2>
        <FilterChipsCommon<Status>
          items={[
            { id: undefined, key: 'emprendimientosFilterAll' },
            { id: 'PENDING', key: 'emprendimientosFilterPending' },
            { id: 'APPROVED', key: 'emprendimientosFilterApproved' },
            { id: 'REJECTED', key: 'emprendimientosFilterRejected' },
          ]}
          basePath={`/admin/ciudades/${city.slug}`}
          tab="emprendimientos"
          active={status}
          namespace="admin.ciudades"
        />
      </header>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800">
          {t('emprendimientosEmpty')}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {items.map((e) => (
            <li key={e.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                {e.heroImageUrl ? (
                  <img src={e.heroImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary-500 to-primary-800" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/cities/${city.slug}/emprendimientos/${e.id}` as Route}
                    target="_blank"
                    className="truncate text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                  >
                    {e.name}
                  </Link>
                </div>
                <div className="truncate text-xs text-neutral-500">
                  {e.ownerName ?? t('anonymousUser')} · {e.category}
                  {e.zone ? ` · ${e.zone}` : ''} ·{' '}
                  {new Date(e.createdAt).toLocaleDateString('es-ES')}
                </div>
                {e.status === 'REJECTED' && e.rejectionReason && (
                  <div className="truncate text-xs text-red-600 dark:text-red-400">
                    {e.rejectionReason}
                  </div>
                )}
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusPillClass[e.status]}`}
              >
                {statusLabel[e.status]}
              </span>
              <EmprendimientoRowActions rowId={e.id} status={e.status} />
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <Pagination
          baseHref={`/admin/ciudades/${city.slug}?tab=emprendimientos${status ? `&status=${status}` : ''}`}
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
