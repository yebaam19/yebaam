'use client';

import { imageUrl } from '@/lib/media/urls';
import { parseVideoEmbed } from '@/lib/utils/video-embed';
import type { MusicMediaItem } from '../../../types/music-media.types';

interface Props {
  item: MusicMediaItem;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

function playerFor(item: MusicMediaItem): React.ReactNode {
  if (item.source === 'cf_image' && item.cf_image_id) {
    return (
      <img
        src={imageUrl(item.cf_image_id, 'public')}
        alt={item.caption ?? ''}
        className="max-h-[70vh] w-full object-contain"
      />
    );
  }
  if (item.source === 'cf_stream' && item.cf_stream_uid) {
    return (
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={`https://iframe.videodelivery.net/${item.cf_stream_uid}`}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }
  if (item.source === 'embed' && item.embed_url) {
    const parsed = parseVideoEmbed(item.embed_url);
    if (parsed) {
      return (
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={parsed.embedSrc}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      );
    }
  }
  return (
    <p className="p-8 text-center text-sm text-zinc-500">
      No se puede previsualizar este item.
    </p>
  );
}

export function AdminMusicMediaPreviewDialog({
  item,
  onClose,
  onEdit,
  onDelete,
  deleting,
}: Props) {
  const sourceLabel =
    item.source === 'cf_image'
      ? 'CF Images'
      : item.source === 'cf_stream'
        ? 'CF Stream'
        : (item.embed_provider ?? 'embed');
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {item.caption ?? <span className="italic text-zinc-400">Sin descripción</span>}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Cerrar
          </button>
        </header>
        <div className="bg-zinc-950">{playerFor(item)}</div>
        <div className="space-y-2 px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
          <p>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {item.kind === 'photo' ? 'Foto' : 'Video'}
            </span>
            {' · '}
            {sourceLabel}
            {' · '}
            {new Date(item.created_at).toLocaleString()}
            {typeof item.duration_seconds === 'number' && item.duration_seconds > 0 && (
              <> · {Math.round(item.duration_seconds)}s</>
            )}
          </p>
          {item.artists.length > 0 && (
            <p>
              <span className="text-zinc-500">Artistas:</span>{' '}
              {item.artists.map((a) => a.name).join(', ')}
            </p>
          )}
          {item.albums.length > 0 && (
            <p>
              <span className="text-zinc-500">Álbum:</span>{' '}
              {item.albums.map((a) => a.title).join(', ')}
            </p>
          )}
          {item.clubs.length > 0 && (
            <p>
              <span className="text-zinc-500">Clubes:</span>{' '}
              {item.clubs.map((c) => c.name).join(', ')}
            </p>
          )}
        </div>
        <footer className="flex flex-wrap justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200"
          >
            {deleting ? 'Borrando…' : 'Borrar'}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Editar
          </button>
        </footer>
      </div>
    </div>
  );
}
