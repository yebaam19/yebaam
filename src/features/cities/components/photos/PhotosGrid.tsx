import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { CityPhoto } from '@/features/cities/server/photos.server'

interface Props {
  photos: CityPhoto[]
}

export async function PhotosGrid({ photos }: Props) {
  const t = await getTranslations('cities.photos')
  if (photos.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('empty')}</p>
      </section>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((p) => (
        <figure
          key={p.id}
          className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800"
        >
          {p.imageUrl ? (
            <Image
              src={p.imageUrl}
              alt={p.caption ?? ''}
              fill
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
          {p.caption && (
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2 text-xs text-white">
              {p.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}
