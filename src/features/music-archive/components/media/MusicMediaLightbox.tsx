'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect } from 'react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import { parseVideoEmbed } from '@/lib/utils/video-embed';
import type { MusicMediaItem } from '../../types/music-media.types';

interface Props {
  item: MusicMediaItem;
  onClose: () => void;
}

export function MusicMediaLightbox({ item, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-full w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        <MediaPreview item={item} />
        <div className="space-y-3 p-4 sm:p-5">
          {item.caption && (
            <p className="text-sm text-zinc-700 dark:text-zinc-200">{item.caption}</p>
          )}
          {item.artists.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Artistas etiquetados
              </p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {item.artists.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/musica/artistas/${a.slug}` as Route}
                      className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                    >
                      {a.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.albums.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Álbum</p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {item.albums.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/musica/albumes/${a.slug}` as Route}
                      className="inline-flex rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {item.clubs.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Club</p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {item.clubs.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/musica/clubes/${c.slug}` as Route}
                      className="inline-flex rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs text-rose-900 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaPreview({ item }: { item: MusicMediaItem }) {
  if (item.kind === 'photo' && item.cf_image_id) {
    return (
      <img
        src={imageUrl(item.cf_image_id, 'public')}
        alt={item.caption ?? ''}
        className="max-h-[70vh] w-full bg-zinc-950 object-contain"
      />
    );
  }
  if (item.kind === 'video' && item.source === 'cf_stream' && item.cf_stream_uid) {
    return (
      <div className="aspect-video w-full bg-black">
        <iframe
          src={`https://iframe.videodelivery.net/${item.cf_stream_uid}`}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
          title={item.caption ?? 'Video'}
        />
      </div>
    );
  }
  if (item.kind === 'video' && item.source === 'embed' && item.embed_url) {
    const parsed = parseVideoEmbed(item.embed_url);
    if (parsed) {
      return (
        <div className="aspect-video w-full bg-black">
          <iframe
            src={parsed.embedSrc}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
            title={item.caption ?? 'Video'}
          />
        </div>
      );
    }
  }
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-zinc-200 text-sm text-zinc-500 dark:bg-zinc-800">
      Contenido no disponible
    </div>
  );
}
