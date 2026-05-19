import { getTranslations } from 'next-intl/server'
import type { CityPublication } from '@/features/cities/server/publications.server'

interface Props {
  publications: CityPublication[]
}

export async function PublicationsFeed({ publications }: Props) {
  const t = await getTranslations('cities.publications')
  if (publications.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('empty')}</p>
      </section>
    )
  }
  return (
    <ul className="space-y-4">
      {publications.map((p) => (
        <li
          key={p.id}
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
            <span>{new Date(p.createdAt).toLocaleDateString('es-ES')}</span>
            {p.isPinned && (
              <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {t('pinned')}
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
            {p.body}
          </p>
        </li>
      ))}
    </ul>
  )
}
