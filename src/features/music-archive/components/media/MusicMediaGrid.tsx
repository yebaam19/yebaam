'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { PlayIcon } from '@/components/icons/heroicons-shim';
import { imageUrl, streamThumb } from '@/lib/media/urls';
import type { MusicMediaItem } from '../../types/music-media.types';
import { useMediaPlayerStore } from './mediaPlayerStore';

interface Props {
  items: MusicMediaItem[];
  /** Empty-state copy when no items are passed. Defaults to a generic line. */
  emptyText?: string;
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

export function MusicMediaGrid({ items, emptyText }: Props) {
  const t = useTranslations('musica.media.grid');
  const openLightbox = useMediaPlayerStore((s) => s.openLightbox);
  const openMini = useMediaPlayerStore((s) => s.openMini);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        {emptyText ?? 'Aún no hay fotos ni videos.'}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const thumb = thumbnailFor(item);
        const label = item.caption ?? (item.kind === 'video' ? 'Video' : 'Foto');
        return (
          <li key={item.id}>
            <div
              role="group"
              aria-label={label}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 transition hover:border-amber-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
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
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                    {item.kind === 'video' ? 'Video' : 'Foto'}
                  </div>
                )}
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/70 to-transparent px-2 py-2 text-left text-xs text-white">
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
                  className="absolute top-1/2 left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition hover:scale-110 hover:bg-black/75 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <PlayIcon className="h-6 w-6 translate-x-0.5" />
                </button>
              )}
            </div>
            {item.artists.length > 0 && (
              <p className="mt-1 truncate text-xs text-zinc-500">
                {item.artists.map((a) => a.name).join(', ')}
              </p>
            )}
            {item.clubs.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {item.clubs.map((c) => (
                  <Link
                    key={c.id}
                    href={`/musica/clubes/${c.slug}` as Route}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-800 transition hover:border-rose-400 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200 dark:hover:bg-rose-900/50"
                    title={`Ir al club ${c.name}`}
                  >
                    <span aria-hidden>♪</span>
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
