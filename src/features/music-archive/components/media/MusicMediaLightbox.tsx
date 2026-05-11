'use client';

import { useEffect, useRef } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import { parseVideoEmbed } from '@/lib/utils/video-embed';
import type { MusicMediaItem } from '../../types/music-media.types';
import { MediaTagChips } from './MediaTagChips';
import { useMediaPlayerStore } from './mediaPlayerStore';

/** Full-screen video/photo viewer for music media. Mounted once in the (app)
 *  layout — appears whenever the media-player store flips to `'lightbox'`,
 *  so it works on any route (including expand-from-mini-player). */
export function MusicMediaLightbox() {
  const item = useMediaPlayerStore((s) => s.item);
  const mode = useMediaPlayerStore((s) => s.mode);
  const close = useMediaPlayerStore((s) => s.close);
  const minimize = useMediaPlayerStore((s) => s.minimize);

  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (mode !== 'lightbox') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mode, close]);

  if (mode !== 'lightbox' || !item) return null;

  const canMinimize = item.kind === 'video';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-stretch justify-center bg-black/85 p-0 sm:items-center sm:p-4"
      onClick={close}
    >
      <div
        className="relative flex h-full w-full max-w-full flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-xl lg:max-w-4xl xl:max-w-5xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 sm:top-3 sm:right-3">
          {canMinimize && (
            <button
              type="button"
              onClick={minimize}
              aria-label="Minimizar a mini reproductor"
              title="Minimizar (seguir viendo mientras navegas)"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus:ring-2 focus:ring-white/70 focus:outline-none"
            >
              <ChevronDownIcon className="h-5 w-5" />
            </button>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus:ring-2 focus:ring-white/70 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-none items-center justify-center bg-black">
          <MediaPreview item={item} />
        </div>

        {(item.caption || hasTags(item)) && (
          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
            {item.caption && (
              <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-200">
                {item.caption}
              </p>
            )}
            {hasTags(item) && (
              <MediaTagChips
                artists={item.artists}
                albums={item.albums}
                clubs={item.clubs}
              />
            )}
          </div>
        )}
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
        className="mx-auto max-h-[70dvh] w-full bg-zinc-950 object-contain sm:max-h-[80dvh]"
      />
    );
  }
  if (item.kind === 'video' && item.source === 'cf_stream' && item.cf_stream_uid) {
    return (
      <div className="aspect-video w-full min-h-[50dvh] bg-black sm:min-h-[60dvh]">
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
        <div className="aspect-video w-full min-h-[50dvh] bg-black sm:min-h-[60dvh]">
          <iframe
            src={parsed.embedSrc}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
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

function hasTags(item: MusicMediaItem): boolean {
  return item.artists.length > 0 || item.albums.length > 0 || item.clubs.length > 0;
}
