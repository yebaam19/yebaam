'use client';

import { useTranslations } from 'next-intl';
import { PlayIcon, PauseIcon } from '@/components/icons/heroicons-shim';
import { usePlayerStore } from './PlayerStore';
import type { AlbumWithDetails, PlayItem } from '../types/music.types';

function formatDuration(seconds: number | null, fallback: string): string {
  if (!seconds || seconds <= 0) return fallback;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatPosition(side: string | null, position: number): string {
  if (side) return `${side.toUpperCase()}${position}`;
  return String(position);
}

interface Props {
  album: AlbumWithDetails;
  /** Pre-signed audio URLs keyed by trackId. Computed server-side and passed in
   *  so the client doesn't have to round-trip per click. */
  audioUrlByTrackId: Record<string, string>;
}

export function AlbumTracklist({ album, audioUrlByTrackId }: Props) {
  const t = useTranslations('musica');
  const setQueue = usePlayerStore((s) => s.setQueue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const playableTracks = album.tracks.filter((t) => audioUrlByTrackId[t.id]);

  function playTrack(trackIndex: number) {
    const items: PlayItem[] = playableTracks.map((t) => ({
      trackId: t.id,
      title: t.title,
      artistName: album.artist.name,
      albumSlug: album.slug,
      artistSlug: album.artist.slug,
      coverCfId: album.cover_cf_image_id,
      audioUrl: audioUrlByTrackId[t.id],
      durationSeconds: t.duration_seconds ?? 0,
    }));
    const startIndex = Math.max(0, items.findIndex((i) => i.trackId === playableTracks[trackIndex].id));
    const currentTrackId = queue[currentIndex]?.trackId;
    // If clicking the currently playing track, just toggle.
    if (currentTrackId === items[startIndex]?.trackId) {
      togglePlay();
      return;
    }
    setQueue(items, startIndex);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-100 bg-zinc-50/50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40">
          <tr>
            <th className="w-10 px-4 py-2"></th>
            <th className="w-14 px-2 py-2">#</th>
            <th className="px-2 py-2">{t('tracklist.colTitle')}</th>
            <th className="hidden px-2 py-2 sm:table-cell">{t('tracklist.colCredits')}</th>
            <th className="w-16 px-4 py-2 text-right">{t('tracklist.colDuration')}</th>
          </tr>
        </thead>
        <tbody>
          {album.tracks.map((track) => {
            const playable = Boolean(audioUrlByTrackId[track.id]);
            const playableIdx = playableTracks.findIndex((p) => p.id === track.id);
            const isCurrent = queue[currentIndex]?.trackId === track.id;
            return (
              <tr
                key={track.id}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => playable && playTrack(playableIdx)}
                    disabled={!playable}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    aria-label={isCurrent && isPlaying ? t('tracklist.pauseAria') : t('tracklist.playAria', { title: track.title })}
                  >
                    {isCurrent && isPlaying ? (
                      <PauseIcon className="h-3.5 w-3.5" />
                    ) : (
                      <PlayIcon className="h-3.5 w-3.5" />
                    )}
                  </button>
                </td>
                <td className="px-2 py-3 text-xs tabular-nums text-zinc-500">
                  {formatPosition(track.side, track.position)}
                </td>
                <td className="px-2 py-3">
                  <p className={`font-medium ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {track.title}
                  </p>
                  {track.credits.length > 0 && (
                    <p className="mt-0.5 text-xs text-zinc-500 sm:hidden">
                      {track.credits.slice(0, 2).map((c) => c.credit_name).join(' · ')}
                    </p>
                  )}
                </td>
                <td className="hidden px-2 py-3 text-xs text-zinc-500 sm:table-cell">
                  {track.credits.length > 0
                    ? track.credits
                        .slice(0, 3)
                        .map((c) => `${c.credit_name} (${c.role})`)
                        .join(' · ')
                    : t('tracklist.creditsNone')}
                </td>
                <td className="px-4 py-3 text-right text-xs tabular-nums text-zinc-500">
                  {formatDuration(track.duration_seconds, t('tracklist.durationNone'))}
                </td>
              </tr>
            );
          })}
          {album.tracks.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-xs text-zinc-500">
                {t('tracklist.empty')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
