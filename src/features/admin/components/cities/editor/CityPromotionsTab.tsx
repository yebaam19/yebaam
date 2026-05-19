import { getTranslations } from 'next-intl/server'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'
import { listCityPromotionsForAdmin } from '@/features/admin/server/cities.server'
import { FilterChipsCommon } from './FilterChipsCommon'
import { Pagination } from './Pagination'
import { AddPromotionForm } from './AddPromotionForm'
import { PromotionRowActions } from './PromotionRowActions'

interface Props {
  city: AdminCityDetail
  statusFilter: string
  page: number
}

type Status = 'active' | 'expired' | 'removed'
const ALL: Status[] = ['active', 'expired', 'removed']

export async function CityPromotionsTab({ city, statusFilter, page }: Props) {
  const t = await getTranslations('admin.ciudades')
  const status = ALL.includes(statusFilter as Status) ? (statusFilter as Status) : undefined
  const { items, total, pageSize } = await listCityPromotionsForAdmin(city.id, {
    status,
    page,
    pageSize: 20,
  })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const now = Date.now()

  const statusCls: Record<Status, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    expired: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    removed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  }
  const statusLabel: Record<Status, string> = {
    active: t('promotionStatusActive'),
    expired: t('promotionStatusExpired'),
    removed: t('promotionStatusRemoved'),
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
        <header className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('promotionsHeading')}
          </h2>
          <FilterChipsCommon<Status>
            items={[
              { id: undefined, key: 'promotionFilterAll' },
              { id: 'active', key: 'promotionFilterActive' },
              { id: 'expired', key: 'promotionFilterExpired' },
              { id: 'removed', key: 'promotionFilterRemoved' },
            ]}
            basePath={`/admin/ciudades/${city.slug}`}
            tab="promotions"
            active={status}
            namespace="admin.ciudades"
          />
        </header>
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800">
            {t('promotionsEmpty')}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {items.map((p) => {
              const expiresMs = new Date(p.expiresAt).getTime()
              const isExpired = expiresMs <= now
              return (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {p.title}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {p.duration} ·{' '}
                      {t('promotionExpiresOn', {
                        date: new Date(p.expiresAt).toLocaleDateString('es-ES'),
                      })}
                      {isExpired && p.status === 'active' ? ` · ${t('promotionExpiredHint')}` : ''}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusCls[p.status]}`}
                  >
                    {statusLabel[p.status]}
                  </span>
                  <PromotionRowActions promotionId={p.id} status={p.status} />
                </li>
              )
            })}
          </ul>
        )}
        {totalPages > 1 && (
          <Pagination
            baseHref={`/admin/ciudades/${city.slug}?tab=promotions${status ? `&status=${status}` : ''}`}
            page={page}
            totalPages={totalPages}
            previousLabel={t('previous')}
            nextLabel={t('next')}
            pageOfLabel={t('pageOf', { page, totalPages })}
          />
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('addPromotionHeading')}
          </h2>
          <p className="text-xs text-neutral-500">{t('addPromotionHint')}</p>
        </header>
        <AddPromotionForm cityId={city.id} />
      </section>
    </div>
  )
}
