'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { ChevronRightIcon, PlayIcon } from '@/components/icons/heroicons-shim';
import { imageUrl, streamThumb } from '@/lib/media/urls';
import type { MusicMediaItem } from '../../types/music-media.types';
import { useMediaPlayerStore } from './mediaPlayerStore';

interface Props {
  items: MusicMediaItem[];
  /** Section heading. */
  title: string;
  /** Secondary line under the heading. Optional. */
  subtitle?: string;
  /** "Ver todos" target. Omit to hide the link. */
  seeAllHref?: Route;
  /** Card width on desktop. Defaults to 220px. Mobile is always 60vw. */
  cardWidthClass?: string;
}

function thumbnailFor(item: MusicMediaItem): string | null {
  if (item.thumbnail_cf_image_id) return imageUrl(item.thumbnail_cf_image_id, 'thumbnail');
  if (item.source === 'cf_image' && item.cf_image_id) return imageUrl(item.cf_image_id, 'thumbnail');
  if (item.source === 'cf_stream' && item.cf_stream_uid)
    return streamThumb(item.cf_stream_uid, { width: 480 });
  if (item.source === 'embed' && item.embed_provider === 'youtube' && item.embed_url) {
    const m = item.embed_url.match(/[?&]v=([^&]+)/);
    if (m) return `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`;
  }
  return null;
}

/** Horizontal snap-scroll strip of media cards — Netflix/YouTube-style row.
 *  Keeps the landing page compact regardless of how many items exist. */
export function MusicMediaTrendingRow({
  items,
  title,
  subtitle,
  seeAllHref,
  cardWidthClass = 'w-[220px]',
}: Props) {
  const t = useTranslations('musica.media.trendingRow');
  const openLightbox = useMediaPlayerStore((s) => s.openLightbox);
  const openMini = useMediaPlayerStore((s) => s.openMini);

  if (items.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          {subtitle && (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="inline-flex flex-none items-center gap-0.5 text-xs font-medium text-zinc-600 hover:text-amber-700 hover:underline dark:text-zinc-300"
          >
            Ver todos
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="-mx-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0">
        <ul className="flex snap-x snap-mandatory gap-3">
          {items.map((item) => {
            const thumb = thumbnailFor(item);
            const label = item.caption ?? (item.kind === 'video' ? 'Video' : 'Foto');
            return (
              <li
                key={item.id}
                className={`shrink-0 snap-start ${cardWidthClass} max-w-[60vw]`}
              >
                <div
                  className="group relative w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 transition hover:border-amber-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  style={{ aspectRatio: '16 / 9' }}
                >
                  <button
                    type="button"
                    onClick={() => openLightbox(item)}
                    className="absolute inset-0 block w-full"
                    aria-label={`Abrir vista completa de ${label}`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.caption ?? ''}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                        {item.kind === 'video' ? 'Video' : 'Foto'}
                      </div>
                    )}
                    {item.caption && (
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/75 to-transparent px-2 py-1.5 text-left text-[11px] text-white">
                        {item.caption}
                      </span>
                    )}
                  </button>
                  {item.kind === 'video' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMini(item);
                      }}
                      aria-label={`Reproducir ${label} en mini-reproductor`}
                      title={t('playInlineTitle')}
                      className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition hover:scale-110 hover:bg-black/75 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    >
                      <PlayIcon className="h-5 w-5 translate-x-0.5" />
                    </button>
                  )}
                </div>
                {(item.artists.length > 0 || item.clubs.length > 0) && (
                  <div className="mt-1.5 space-y-1">
                    {item.artists.length > 0 && (
                      <p className="truncate text-xs text-zinc-700 dark:text-zinc-200">
                        {item.artists.map((a) => a.name).join(', ')}
                      </p>
                    )}
                    {item.clubs.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.clubs.slice(0, 2).map((c) => (
                          <Link
                            key={c.id}
                            href={`/musica/clubes/${c.slug}` as Route}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-0.5 rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-800 transition hover:border-rose-400 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
                            title={`Ir al club ${c.name}`}
                          >
                            <span aria-hidden>♪</span>
                            <span className="truncate">{c.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
