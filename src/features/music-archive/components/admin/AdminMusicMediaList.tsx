'use client';

import { useState, useTransition } from 'react';
import { imageUrl, streamThumb } from '@/lib/media/urls';
import { deleteMusicMedia } from '../../actions/music-media.actions';
import type { MusicMediaItem } from '../../types/music-media.types';
import { MusicMediaUploader } from '../media/MusicMediaUploader';

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
  const [items, setItems] = useState(initial);
  const [showUploader, setShowUploader] = useState(false);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm('¿Borrar este item? Esta acción no se puede deshacer.')) return;
    setBusyId(id);
    startTransition(async () => {
      const res = await deleteMusicMedia(id);
      setBusyId(null);
      if (res.ok) setItems((cur) => cur.filter((i) => i.id !== id));
      else alert(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {items.length} {items.length === 1 ? 'item' : 'items'} en el archivo.
        </p>
        <button
          type="button"
          onClick={() => setShowUploader(true)}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
        >
          Subir foto / video
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          Aún no hay fotos ni videos en el archivo.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {items.map((item) => {
            const thumb = thumbFor(item);
            return (
              <li key={item.id} className="flex gap-3 p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                      {item.kind === 'video' ? 'Video' : 'Foto'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {item.caption ?? <span className="italic text-zinc-400">Sin descripción</span>}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {item.kind === 'photo' ? 'Foto' : 'Video'} ·{' '}
                    {item.source === 'cf_image'
                      ? 'CF Images'
                      : item.source === 'cf_stream'
                        ? 'CF Stream'
                        : (item.embed_provider ?? 'embed')}
                    {' · '}
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  {item.artists.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      Artistas: {item.artists.map((a) => a.name).join(', ')}
                    </p>
                  )}
                  {item.albums.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      Álbum: {item.albums.map((a) => a.title).join(', ')}
                    </p>
                  )}
                  {item.clubs.length > 0 && (
                    <p className="text-xs text-zinc-500">
                      Club: {item.clubs.map((c) => c.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-start">
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={pending && busyId === item.id}
                    className="rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200"
                  >
                    Borrar
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
    </div>
  );
}
