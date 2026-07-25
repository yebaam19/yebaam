'use client';

import { useTranslations } from 'next-intl';
import { ArrowsPointingOutIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { parseVideoEmbed } from '@/lib/utils/video-embed';
import type { MusicMediaItem } from '../../types/music-media.types';
import { usePlayerStore } from '../PlayerStore';
import { useMediaPlayerStore } from './mediaPlayerStore';

function Frame({ item }: { item: MusicMediaItem }) {
  const t = useTranslations('player.miniPlayer');
  if (item.source === 'cf_stream' && item.cf_stream_uid) {
    return (
      <iframe
        src={`https://iframe.videodelivery.net/${item.cf_stream_uid}?autoplay=true&muted=true`}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
        title={item.caption ?? t('videoTitleFallback')}
      />
    );
  }
  if (item.source === 'embed' && item.embed_url) {
    const parsed = parseVideoEmbed(item.embed_url, { autoplay: true });
    if (parsed) {
      return (
        <iframe
          src={parsed.embedSrc}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
          title={item.caption ?? t('videoTitleFallback')}
        />
      );
    }
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-zinc-400">
      {t('unavailable')}
    </div>
  );
}

export function MusicMediaMiniPlayer() {
  const t = useTranslations('player.miniPlayer');
  const item = useMediaPlayerStore((s) => s.item);
  const mode = useMediaPlayerStore((s) => s.mode);
  const expand = useMediaPlayerStore((s) => s.expand);
  const close = useMediaPlayerStore((s) => s.close);

  // Stack above the audio PlayerBar when an audio track is active.
  const hasAudioTrack = usePlayerStore((s) => s.queue.length > 0);

  if (mode !== 'mini' || !item || item.kind !== 'video') return null;

  // Mobile offset: PlayerBar is ~64px on mobile. Desktop offset: ~72px.
  const bottomOffsetMobile = hasAudioTrack ? 'bottom-[64px]' : 'bottom-0';
  const bottomOffsetDesktop = hasAudioTrack ? 'sm:bottom-[80px]' : 'sm:bottom-4';

  return (
    <div
      role="region"
      aria-label={t('regionAria')}
      className={`fixed inset-x-0 z-40 ${bottomOffsetMobile} sm:inset-x-auto sm:right-4 ${bottomOffsetDesktop} sm:w-[360px]`}
    >
      <div className="overflow-hidden border border-zinc-200 bg-zinc-950 shadow-2xl sm:rounded-xl dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200">
          <p className="min-w-0 flex-1 truncate" title={item.caption ?? undefined}>
            {item.caption ?? <span className="text-zinc-500 italic">{t('noCaption')}</span>}
          </p>
          <div className="flex flex-none items-center gap-1">
            <button
              type="button"
              onClick={expand}
              aria-label={t('expandAria')}
              className="rounded p-1 text-zinc-300 hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={close}
              aria-label={t('closeAria')}
              className="rounded p-1 text-zinc-300 hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="aspect-video w-full bg-black">
          <Frame item={item} />
        </div>
      </div>
    </div>
  );
}
