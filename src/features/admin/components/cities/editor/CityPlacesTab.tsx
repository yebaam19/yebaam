import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'
import { listCityPlacesForAdmin } from '@/features/admin/server/cities.server'
import { FilterChipsCommon } from './FilterChipsCommon'
import { Pagination } from './Pagination'
import { CityPlaceForm } from './CityPlaceForm'
import { DeletePlaceButton } from './DeletePlaceButton'

interface Props {
  city: AdminCityDetail
  statusFilter: string
  page: number
}

type Status = 'pending' | 'approved' | 'rejected'

const ALL_STATUSES: Status[] = ['pending', 'approved', 'rejected']

export async function CityPlacesTab({ city, statusFilter, page }: Props) {
  const t = await getTranslations('admin.ciudades')
  const status = ALL_STATUSES.includes(statusFilter as Status)
    ? (statusFilter as Status)
    : undefined
  const { items, total, pageSize } = await listCityPlacesForAdmin(city.id, {
    status,
    page,
    pageSize: 24,
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
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900">
        <header className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('placesHeading')}
          </h2>
          <FilterChipsCommon<Status>
            items={[
              { id: undefined, key: 'placesFilterAll' },
              { id: 'pending', key: 'placesFilterPending' },
              { id: 'approved', key: 'placesFilterApproved' },
              { id: 'rejected', key: 'placesFilterRejected' },
            ]}
            basePath={`/admin/ciudades/${city.slug}`}
            tab="places"
            active={status}
            namespace="admin.ciudades"
          />
        </header>
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800">
            {t('placesEmpty')}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {items.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt=""
                      width={80}
                      height={56}
                      unoptimized
                      className="h-14 w-20 object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {p.name}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {p.category ?? '—'}
                    {p.address ? ` · ${p.address}` : ''}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusPillClass[p.status]}`}
                >
                  {statusLabel[p.status]}
                </span>
                <DeletePlaceButton placeId={p.id} />
              </li>
            ))}
          </ul>
        )}
        {totalPages > 1 && (
          <Pagination
            baseHref={`/admin/ciudades/${city.slug}?tab=places${status ? `&status=${status}` : ''}`}
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
            {t('addPlaceHeading')}
          </h2>
          <p className="text-xs text-neutral-500">{t('addPlaceHint')}</p>
        </header>
        <CityPlaceForm cityId={city.id} />
      </section>
    </div>
  )
}
