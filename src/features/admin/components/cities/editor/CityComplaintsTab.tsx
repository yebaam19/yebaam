import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { AdminCityDetail } from '@/features/admin/server/cities.server'
import { listCityComplaintsForAdmin } from '@/features/admin/server/cities.server'
import { FilterChipsCommon } from './FilterChipsCommon'
import { Pagination } from './Pagination'
import { ComplaintRowActions } from './ComplaintRowActions'

interface Props {
  city: AdminCityDetail
  statusFilter: string
  page: number
}

type Status = 'new' | 'seen' | 'resolved' | 'rejected'
const ALL: Status[] = ['new', 'seen', 'resolved', 'rejected']

export async function CityComplaintsTab({ city, statusFilter, page }: Props) {
  const t = await getTranslations('admin.ciudades')
  const status = ALL.includes(statusFilter as Status) ? (statusFilter as Status) : undefined
  const { items, total, pageSize } = await listCityComplaintsForAdmin(city.id, {
    status,
    page,
    pageSize: 20,
  })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const cls: Record<Status, string> = {
    new: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    seen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  }
  const label: Record<Status, string> = {
    new: t('complaintStatusNew'),
    seen: t('complaintStatusSeen'),
    resolved: t('complaintStatusResolved'),
    rejected: t('complaintStatusRejected'),
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('complaintsHeading')}
        </h2>
        <FilterChipsCommon<Status>
          items={[
            { id: undefined, key: 'complaintFilterAll' },
            { id: 'new', key: 'complaintFilterNew' },
            { id: 'seen', key: 'complaintFilterSeen' },
            { id: 'resolved', key: 'complaintFilterResolved' },
            { id: 'rejected', key: 'complaintFilterRejected' },
          ]}
          basePath={`/admin/ciudades/${city.slug}`}
          tab="complaints"
          active={status}
          namespace="admin.ciudades"
        />
      </header>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800">
          {t('complaintsEmpty')}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {items.map((c) => (
            <li key={c.id} className="space-y-2 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {c.title}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls[c.status]}`}
                >
                  {label[c.status]}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                {c.category && <span>{c.category}</span>}
                <span>{c.reporterName ?? t('anonymousUser')}</span>
                <span>{new Date(c.createdAt).toLocaleDateString('es-ES')}</span>
              </div>
              {c.description && (
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                  {c.description}
                </p>
              )}
              {c.imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {c.imageUrls.map((url) => (
                    <div
                      key={url}
                      className="relative h-16 w-16 overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800"
                    >
                      <Image src={url} alt="" fill unoptimized sizes="64px" className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <ComplaintRowActions complaintId={c.id} status={c.status} />
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <Pagination
          baseHref={`/admin/ciudades/${city.slug}?tab=complaints${status ? `&status=${status}` : ''}`}
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
