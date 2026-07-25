'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { imageUrl, streamThumb } from '@/lib/media/urls';
import { deleteMusicMedia } from '../../actions/music-media.actions';
import type { MusicMediaItem } from '../../types/music-media.types';
import { MusicMediaUploader } from '../media/MusicMediaUploader';
import { AdminMusicMediaEditDialog } from './media/AdminMusicMediaEditDialog';
import { AdminMusicMediaPreviewDialog } from './media/AdminMusicMediaPreviewDialog';

interface Props {
  initial: MusicMediaItem[];
}

function thumbFor(item: MusicMediaItem): string | null {
  if (item.thumbnail_cf_image_id) return imageUrl(item.thumbnail_cf_image_id, 'thumbnail');
  if (item.source === 'cf_image' && item.cf_image_id) return imageUrl(item.cf_image_id, 'thumbnail');
  if (item.source === 'cf_stream' && item.cf_stream_uid)
    return streamThumb(item.cf_stream_uid, { width: 240 });
  if (item.source === 'embed' && item.embed_provider === 'youtube' && item.embed_url) {
    const m = item.embed_url.match(/[?&]v=([^&]+)/);
    if (m) return `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`;
  }
  return null;
}

export function AdminMusicMediaList({ initial }: Props) {
  const t = useTranslations('musica.admin.mediaList');
  const [items, setItems] = useState(initial);
  const [showUploader, setShowUploader] = useState(false);
  const [editing, setEditing] = useState<MusicMediaItem | null>(null);
  const [previewing, setPreviewing] = useState<MusicMediaItem | null>(null);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return;
    setBusyId(id);
    startTransition(async () => {
      const res = await deleteMusicMedia(id);
      setBusyId(null);
      if (res.ok) {
        setItems((cur) => cur.filter((i) => i.id !== id));
        setPreviewing((cur) => (cur?.id === id ? null : cur));
        setEditing((cur) => (cur?.id === id ? null : cur));
      } else {
        alert(res.error);
      }
    });
  }

  function applyPatch(patched: MusicMediaItem) {
    setItems((cur) => cur.map((i) => (i.id === patched.id ? patched : i)));
    setPreviewing((cur) => (cur?.id === patched.id ? patched : cur));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t('itemsCount', { count: items.length })}
        </p>
        <button
          type="button"
          onClick={() => setShowUploader(true)}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
        >
          {t('uploadButton')}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          {t('empty')}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {items.map((item) => {
            const thumb = thumbFor(item);
            return (
              <li key={item.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setPreviewing(item)}
                  className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-zinc-800"
                  aria-label={t('previewAria', { label: item.caption ?? t('previewFallbackLabel') })}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                      {item.kind === 'video' ? t('kindVideo') : t('kindPhoto')}
                    </div>
                  )}
                  {item.kind === 'video' && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  )}
                </button>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {item.caption ?? <span className="italic text-zinc-400">{t('noCaption')}</span>}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {item.kind === 'photo' ? t('kindPhoto') : t('kindVideo')} ·{' '}
                    {item.source === 'cf_image'
                      ? t('sourceCfImages')
                      : item.source === 'cf_stream'
                        ? t('sourceCfStream')
                        : (item.embed_provider ?? t('sourceEmbed'))}
                    {' · '}
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  {item.artists.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      {t('artistsLine', { names: item.artists.map((a) => a.name).join(', ') })}
                    </p>
                  )}
                  {item.albums.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      {t('albumsLine', { names: item.albums.map((a) => a.title).join(', ') })}
                    </p>
                  )}
                  {item.clubs.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      {t('clubsLine', { names: item.clubs.map((c) => c.name).join(', ') })}
                    </p>
                  )}
                </div>
                <div className="flex flex-none flex-wrap gap-2 sm:items-start">
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={pending && busyId === item.id}
                    className="rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200"
                  >
                    {t('delete')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showUploader && (
        <MusicMediaUploader
          onClose={() => setShowUploader(false)}
          onCreated={() => {
            // Quick reload so the new item shows. A full router.refresh() would
            // also work; we keep this local so we don't bounce the tab state.
            window.location.reload();
          }}
        />
      )}

      {previewing && (
        <AdminMusicMediaPreviewDialog
          item={previewing}
          onClose={() => setPreviewing(null)}
          onEdit={() => {
            setEditing(previewing);
            setPreviewing(null);
          }}
          onDelete={() => handleDelete(previewing.id)}
          deleting={pending && busyId === previewing.id}
        />
      )}

      {editing && (
        <AdminMusicMediaEditDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(patched) => {
            applyPatch(patched);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
