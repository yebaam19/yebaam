'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowsPointingOutIcon,
  PhotoIcon,
  PlayIcon,
  VideoCameraIcon,
} from '@/components/icons/heroicons-shim';
import { imageUrl, streamThumb } from '@/lib/media/urls';
import { parseVideoEmbed } from '@/lib/utils/video-embed';
import type { MusicMediaItem } from '../../types/music-media.types';
import { MediaTagChips } from './MediaTagChips';
import { useMediaPlayerStore } from './mediaPlayerStore';

interface Props {
  items: MusicMediaItem[];
}

export function ClubMediaFeed({ items }: Props) {
  const openLightbox = useMediaPlayerStore((s) => s.openLightbox);
  return (
    <ul className="mx-auto max-w-2xl space-y-4">
      {items.map((item) => (
        <li key={item.id}>
          <FeedCard item={item} onExpand={() => openLightbox(item)} />
        </li>
      ))}
    </ul>
  );
}

function FeedCard({ item, onExpand }: { item: MusicMediaItem; onExpand: () => void }) {
  const t = useTranslations('musica.media.clubFeed');
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {item.kind === 'video' ? (
            <VideoCameraIcon className="h-4 w-4" />
          ) : (
            <PhotoIcon className="h-4 w-4" />
          )}
          <span>{formatRelative(item.created_at)}</span>
        </div>
        <button
          type="button"
          onClick={onExpand}
          aria-label={t('fullscreenTitle')}
          title={t('fullscreenTitle')}
          className="rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowsPointingOutIcon className="h-4 w-4" />
        </button>
      </header>
      <MediaSurface item={item} onPhotoClick={onExpand} />
      {(item.caption || hasTags(item)) && (
        <div className="space-y-3 px-4 py-3">
          {item.caption && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              {item.caption}
            </p>
          )}
          {hasTags(item) && (
            <MediaTagChips
              compact
              artists={item.artists}
              albums={item.albums}
              clubs={item.clubs}
            />
          )}
        </div>
      )}
    </article>
  );
}

function MediaSurface({
  item,
  onPhotoClick,
}: {
  item: MusicMediaItem;
  onPhotoClick: () => void;
}) {
  if (item.kind === 'photo' && item.cf_image_id) {
    return (
      <button
        type="button"
        onClick={onPhotoClick}
        className="block w-full bg-zinc-950"
        aria-label={item.caption ?? 'Abrir foto'}
      >
        <img
          src={imageUrl(item.cf_image_id, 'public')}
          alt={item.caption ?? ''}
          loading="lazy"
          className="mx-auto max-h-[70vh] w-full object-contain"
          decoding="async"
        />
      </button>
    );
  }
  if (item.kind === 'video' && item.source === 'cf_stream' && item.cf_stream_uid) {
    return (
      <VideoSurface
        // 640, not 1280: measured 76 KB vs 203 KB on real clips (6x the native
        // frame) for a poster that is replaced by the player on first click.
        thumb={streamThumb(item.cf_stream_uid, { width: 640 })}
        iframeSrc={`https://iframe.videodelivery.net/${item.cf_stream_uid}?autoplay=true`}
        title={item.caption ?? 'Video'}
      />
    );
  }
  if (item.kind === 'video' && item.source === 'embed' && item.embed_url) {
    const parsed = parseVideoEmbed(item.embed_url);
    if (parsed) {
      const autoplaySrc = appendAutoplay(parsed.embedSrc);
      return (
        <VideoSurface
          thumb={parsed.thumbnailUrl}
          iframeSrc={autoplaySrc}
          title={item.caption ?? 'Video'}
        />
      );
    }
  }
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-zinc-200 text-sm text-zinc-500 dark:bg-zinc-800">
      Contenido no disponible
    </div>
  );
}

function VideoSurface({
  thumb,
  iframeSrc,
  title,
}: {
  thumb: string | null;
  iframeSrc: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <div className="aspect-video w-full bg-black">
        <iframe
          src={iframeSrc}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
          title={title}
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative block aspect-video w-full overflow-hidden bg-black"
      aria-label={`Reproducir: ${title}`}
    >
      {thumb ? (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
          decoding="async"
        />
      ) : (
        <div className="h-full w-full bg-zinc-900" />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-black/0 via-black/0 to-black/40">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition group-hover:scale-110 group-hover:bg-black/75">
          <PlayIcon className="h-8 w-8 translate-x-0.5" />
        </span>
      </span>
    </button>
  );
}

function hasTags(item: MusicMediaItem): boolean {
  return item.artists.length > 0 || item.albums.length > 0 || item.clubs.length > 0;
}

function appendAutoplay(src: string): string {
  // YouTube/Vimeo embed URLs already produced by parseVideoEmbed — add autoplay=1
  // so the click feels instant. (User explicitly clicked play, so this is allowed.)
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}autoplay=1`;
}

function formatRelative(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = now - then;
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return 'ahora';
    const min = Math.floor(sec / 60);
    if (min < 60) return `hace ${min} min`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `hace ${hr} h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `hace ${day} d`;
    return new Date(iso).toLocaleDateString('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}
