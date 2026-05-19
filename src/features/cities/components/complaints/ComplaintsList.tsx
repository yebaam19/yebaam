import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { CityComplaint } from '@/features/cities/server/complaints.server'

interface Props {
  complaints: CityComplaint[]
}

const STATUS_CLS: Record<CityComplaint['status'], string> = {
  new: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  seen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
}

export async function ComplaintsList({ complaints }: Props) {
  const t = await getTranslations('cities.complaints')
  if (complaints.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('empty')}</p>
      </section>
    )
  }
  return (
    <ul className="space-y-4">
      {complaints.map((c) => (
        <li
          key={c.id}
          className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="space-y-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{c.title}</h3>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLS[c.status]}`}
              >
                {t(`status_${c.status}`)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              {c.category && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                  {c.category}
                </span>
              )}
              <span>{new Date(c.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
            {c.description && (
              <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                {c.description}
              </p>
            )}
            {c.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {c.imageUrls.map((url) => (
                  <div
                    key={url}
                    className="relative aspect-square overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800"
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
