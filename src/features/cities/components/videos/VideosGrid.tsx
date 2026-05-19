import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { PlayIcon } from '@/components/icons/heroicons-shim'
import type { CityVideo } from '@/features/cities/server/videos.server'

interface Props {
  videos: CityVideo[]
}

export async function VideosGrid({ videos }: Props) {
  const t = await getTranslations('cities.videos')
  if (videos.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('empty')}</p>
      </section>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v) => (
        <article
          key={v.id}
          className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="relative aspect-video w-full bg-neutral-900">
            {v.embedUrl ? (
              <iframe
                src={v.embedUrl}
                title={v.caption ?? ''}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
                loading="lazy"
              />
            ) : v.thumbnailUrl ? (
              <>
                <Image
                  src={v.thumbnailUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <PlayIcon className="h-12 w-12 text-white" />
                </div>
              </>
            ) : null}
          </div>
          {v.caption && (
            <p className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200">{v.caption}</p>
          )}
        </article>
      ))}
    </div>
  )
}
