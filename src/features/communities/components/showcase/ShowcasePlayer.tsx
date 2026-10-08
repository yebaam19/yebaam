'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import type { StreamPlayerApi } from '@cloudflare/stream-react';
import { useTranslations } from 'next-intl';
import { PlayIcon } from '@/components/icons/heroicons-shim';
import { Button } from '@/ui/Button';
import { streamThumb } from '@/lib/media/urls';
import type { LibraryAsset } from '../../types/communityLibrary.types';

const Stream = dynamic(() => import('@cloudflare/stream-react').then((module) => module.Stream), { ssr: false, loading: () => <PlayerLoading /> });
const duration = (seconds: number | null) => seconds === null ? null
  : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function PlayerLoading() {
  const t = useTranslations('communities.showcase');
  return <p role="status" className="p-4 text-sm text-white">{t('loadingPlayer')}</p>;
}

export function ShowcasePlayer({ videos }: { videos: LibraryAsset[] }) {
  const t = useTranslations('communities.showcase');
  const [selected, setSelected] = useState(videos[0]?.id);
  const [activated, setActivated] = useState(false);
  const [consecutive, setConsecutive] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [sound, setSound] = useState({ muted: false, volume: 1 });
  const player = useRef<StreamPlayerApi | undefined>(undefined);
  const current = videos.find((video) => video.id === selected) ?? videos[0];
  if (!current) return null;
  const choose = (id: string) => { setSelected(id); setActivated(true); setError(false); };
  return <div className="min-w-0 space-y-3">
    <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-950">
      {activated ? <Stream key={`${current.media_id}:${attempt}`} src={current.media_id} title={current.title}
        streamRef={player} controls autoplay muted={sound.muted} volume={sound.volume}
        responsive={false} width="100%" height="100%" className="h-full w-full" primaryColor="#087632"
        onError={() => setError(true)} onVolumeChange={() => {
          if (!player.current) return;
          const next = { muted: player.current.muted, volume: player.current.volume };
          setSound((previous) => previous.muted === next.muted && previous.volume === next.volume ? previous : next);
        }} onEnded={() => {
          const next = videos[videos.findIndex((video) => video.id === current.id) + 1];
          if (consecutive && next) choose(next.id);
        }} /> : <button type="button" onClick={() => setActivated(true)} aria-label={t('play', { title: current.title })}
          className="relative flex h-full w-full items-center justify-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-secondary-300">
          <img src={streamThumb(current.media_id)} alt="" className="absolute inset-0 h-full w-full object-contain" loading="lazy" />
          <span className="relative flex size-14 items-center justify-center rounded-full bg-primary-800 text-white"><PlayIcon className="size-6" /></span>
        </button>}
    </div>
    {error && <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-red-700 dark:text-red-300">
      <span>{t('playError')}</span><Button outline onClick={() => { setError(false); setAttempt((value) => value + 1); }}>{t('retry')}</Button>
    </div>}
    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm" aria-live="polite">
      <p className="min-w-0 wrap-anywhere font-semibold">{current.title}</p>
      {duration(current.duration_seconds) && <span className="text-neutral-600 tabular-nums dark:text-neutral-300">{duration(current.duration_seconds)}</span>}
    </div>
    {videos.length > 1 && <>
      <ul className="grid grid-cols-3 gap-2">
        {videos.filter((video) => video.id !== current.id).map((video) => <li key={video.id} className="min-w-0">
          <button type="button" onClick={() => choose(video.id)} aria-label={t('play', { title: video.title })}
            className="w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300">
            <span className="relative block aspect-video overflow-hidden rounded-lg bg-neutral-950">
              <img src={streamThumb(video.media_id)} alt="" loading="lazy" className="h-full w-full object-contain" />
              {duration(video.duration_seconds) && <span className="absolute right-1 bottom-1 rounded bg-black/80 px-1 text-xs text-white tabular-nums">{duration(video.duration_seconds)}</span>}
            </span>
            <span className="mt-1 block wrap-anywhere text-xs font-medium text-neutral-700 dark:text-neutral-200">{video.title}</span>
          </button>
        </li>)}
      </ul>
      <label className="flex min-h-11 items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
        <input type="checkbox" checked={consecutive} onChange={(event) => setConsecutive(event.target.checked)} className="rounded text-primary-800 focus:ring-primary-800" />
        {t('consecutive')}
      </label>
    </>}
  </div>;
}
