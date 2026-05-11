'use client';

import { useState } from 'react';
import { PlayIcon } from '@/components/icons/heroicons-shim';
import { imageUrl, streamThumb } from '@/lib/media/urls';
import type { MusicMediaItem } from '../../types/music-media.types';
import { MusicMediaLightbox } from './MusicMediaLightbox';

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
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((i) => i.id === openId) ?? null;

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        {emptyText ?? 'Aún no hay fotos ni videos.'}
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const thumb = thumbnailFor(item);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId(item.id)}
                className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 transition hover:border-amber-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                aria-label={item.caption ?? 'Abrir media'}
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
                {item.kind === 'video' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-black/0 via-black/0 to-black/30">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white">
                      <PlayIcon className="h-6 w-6" />
                    </span>
                  </span>
                )}
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/70 to-transparent px-2 py-2 text-left text-xs text-white">
                    {item.caption}
                  </span>
                )}
              </button>
              {item.artists.length > 0 && (
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {item.artists.map((a) => a.name).join(', ')}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {open && <MusicMediaLightbox item={open} onClose={() => setOpenId(null)} />}
    </>
  );
}
