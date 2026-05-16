'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { EllipsisHorizontalIcon, PlayIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import type { MusicAlbumRow } from '../types/music.types';

interface Props {
  album: MusicAlbumRow;
  artistName?: string;
}

const WAVEFORM_BARS = [
  18, 32, 24, 48, 36, 62, 28, 78, 42, 58, 24, 70, 36, 88, 52, 32, 64, 40, 76, 28,
  56, 84, 38, 60, 30, 72, 46, 90, 26, 54, 38, 68, 22, 80, 44, 56, 30, 74, 50, 36,
  62, 28, 78, 42, 60, 26, 70, 38, 84, 32, 56, 44, 76, 30, 66, 24, 88, 40, 58, 34,
];

function WaveformFallback() {
  return (
    <div className="flex h-full w-full items-end justify-between gap-[2px] bg-zinc-950 px-2 py-3">
      {WAVEFORM_BARS.map((h, i) => (
        <span
          key={i}
          className="flex-1 rounded-[1px] bg-white/90"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function AlbumCoverCard({ album, artistName }: Props) {
  const t = useTranslations('musica');
  const cover = album.cover_cf_image_id ? imageUrl(album.cover_cf_image_id, 'thumbnail') : null;
  return (
    <div className="group relative">
      <Link
        href={`/musica/albumes/${album.slug}` as Route}
        className="block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {cover ? (
            <img
              src={cover}
              alt={t('albumCard.coverAlt', { title: album.title })}
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <>
              <WaveformFallback />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md transition group-hover:scale-105">
                  <PlayIcon className="h-6 w-6 translate-x-[1px] text-zinc-900" />
                </span>
              </div>
            </>
          )}
          {album.for_trade && (
            <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
              {t('albumCard.tradeBadge')}
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-2 p-3 pr-9">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {album.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {artistName ? `${artistName} · ` : ''}
              {album.year ?? (album.decade ? `${album.decade}s` : t('albumCard.yearDash'))}
              {album.country ? ` · ${album.country}` : ''}
            </p>
          </div>
        </div>
      </Link>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 right-2 rounded-full p-1.5 text-zinc-400"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </span>
    </div>
  );
}
