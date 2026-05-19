import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import {
  listCityPhotosForAdmin,
  listCityVideosForAdmin,
  listCityPublicationsForAdmin,
  type AdminCityDetail,
} from '@/features/admin/server/cities.server'
import { AddPhotoForm } from './AddPhotoForm'
import { AddVideoForm } from './AddVideoForm'
import { AddPublicationForm } from './AddPublicationForm'
import { DeletePhotoButton } from './DeletePhotoButton'
import { DeleteVideoButton } from './DeleteVideoButton'
import { PublicationRowActions } from './PublicationRowActions'

interface Props {
  city: AdminCityDetail
}

/**
 * One admin tab that owns all three city-media surfaces (photos, videos,
 * publications). Splitting into three tabs felt heavy when the editor
 * already had 7 — this keeps everything one click away.
 */
export async function CityMultimediaTab({ city }: Props) {
  const t = await getTranslations('admin.ciudades')
  const [photos, videos, pubs] = await Promise.all([
    listCityPhotosForAdmin(city.id, { page: 1, pageSize: 24 }),
    listCityVideosForAdmin(city.id, { page: 1, pageSize: 20 }),
    listCityPublicationsForAdmin(city.id, { page: 1, pageSize: 20 }),
  ])

  return (
    <div className="space-y-6">
      {/* PHOTOS */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('photosHeading')}
          </h2>
          <span className="text-xs text-neutral-500">{photos.total}</span>
        </header>
        <AddPhotoForm cityId={city.id} />
        {photos.items.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-800">
            {t('photosEmpty')}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {photos.items.map((p) => (
              <li
                key={p.id}
                className="relative aspect-square overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800"
              >
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 33vw, 16vw"
                    className="object-cover"
                  />
                )}
                <div className="absolute right-1 top-1">
                  <DeletePhotoButton photoId={p.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* VIDEOS */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('videosHeading')}
          </h2>
          <span className="text-xs text-neutral-500">{videos.total}</span>
        </header>
        <AddVideoForm cityId={city.id} />
        {videos.items.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-800">
            {t('videosEmpty')}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {videos.items.map((v) => (
              <li
                key={v.id}
                className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800"
              >
                <div className="relative aspect-video bg-neutral-900">
                  {v.thumbnailUrl && (
                    <Image
                      src={v.thumbnailUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute right-1 top-1">
                    <DeleteVideoButton videoId={v.id} />
                  </div>
                </div>
                {v.caption && (
                  <p className="truncate px-2 py-1 text-xs text-neutral-600 dark:text-neutral-300">
                    {v.caption}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* PUBLICATIONS */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {t('publicationsHeading')}
          </h2>
          <span className="text-xs text-neutral-500">{pubs.total}</span>
        </header>
        <AddPublicationForm cityId={city.id} />
        {pubs.items.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-800">
            {t('publicationsEmpty')}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800">
            {pubs.items.map((p) => (
              <li key={p.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500">
                    <span>{new Date(p.createdAt).toLocaleString('es-ES')}</span>
                    {p.isPinned && (
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        {t('pinnedPill')}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200">
                    {p.body}
                  </p>
                </div>
                <PublicationRowActions publicationId={p.id} isPinned={p.isPinned} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
