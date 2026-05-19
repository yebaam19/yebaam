import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { ClockIcon } from '@/components/icons/heroicons-shim'
import type { CityPromotion } from '@/features/cities/server/promotions.server'

interface Props {
  promotions: CityPromotion[]
}

export async function PromotionsList({ promotions }: Props) {
  const t = await getTranslations('cities.promotions')
  if (promotions.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('empty')}</p>
      </section>
    )
  }
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {promotions.map((p) => {
        const expires = new Date(p.expiresAt)
        return (
          <li
            key={p.id}
            className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            {p.coverImageUrl && (
              <div className="relative aspect-[16/9] w-full bg-neutral-200 dark:bg-neutral-800">
                <Image
                  src={p.coverImageUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-2 p-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {p.title}
              </h3>
              {p.body && (
                <p className="line-clamp-3 text-sm text-neutral-700 dark:text-neutral-300">{p.body}</p>
              )}
              <p className="flex items-center gap-1 text-xs text-neutral-500">
                <ClockIcon className="h-3.5 w-3.5" />
                {t('expiresOn', { date: expires.toLocaleDateString('es-ES') })}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
