'use client';

import { useState } from 'react';
import { DeleteConfirmDialog } from '@/features/professional-profile/components/dialogs';
import { imageUrl } from '@/lib/media/urls';
import { deleteAlbum, listAdminAlbums } from '../../actions/music.actions';
import { inputCls } from '../upload/constants';
import { useAdminEntitySearch } from './useAdminEntitySearch';
import { AdminAlbumEditor } from './AdminAlbumEditor';

interface AlbumRow {
  id: string;
  title: string;
  slug: string;
  year: number | null;
  country: string | null;
  format: string;
  cover_cf_image_id: string | null;
  catalog_number: string | null;
  artist_id: string;
  artist_name: string;
  track_count: number;
}

interface Props {
  initialAlbums: AlbumRow[];
}

export function AdminAlbumsList({ initialAlbums }: Props) {
  const { query, setQuery, rows, setRows, pending, error, refresh } =
    useAdminEntitySearch<AlbumRow>({
      initial: initialAlbums,
      fetcher: listAdminAlbums,
    });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AlbumRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar álbum…"
          className={`${inputCls} max-w-md`}
        />
        <span className="text-xs text-zinc-500">
          {pending ? 'Buscando…' : `${rows.length} álbumes`}
        </span>
        <span className="ml-auto text-xs text-zinc-500">
          Para agregar un disco nuevo, usa la pestaña <strong>Subir disco</strong>.
        </span>
      </div>
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50">
            <tr>
              <th className="px-3 py-2">Carátula</th>
              <th className="px-3 py-2">Título</th>
              <th className="px-3 py-2">Artista</th>
              <th className="px-3 py-2">Año</th>
              <th className="px-3 py-2">País</th>
              <th className="px-3 py-2">Formato</th>
              <th className="px-3 py-2">Tracks</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-xs text-zinc-500">
                  {pending ? '…' : 'No hay álbumes.'}
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <td className="px-3 py-2">
                    {a.cover_cf_image_id ? (
                      <img
                        src={imageUrl(a.cover_cf_image_id, 'thumbnail')}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-zinc-200 dark:bg-zinc-700" />
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                    {a.title}
                  </td>
                  <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{a.artist_name}</td>
                  <td className="px-3 py-2 tabular-nums text-zinc-500">{a.year ?? '—'}</td>
                  <td className="px-3 py-2 text-zinc-500">{a.country ?? '—'}</td>
                  <td className="px-3 py-2 text-zinc-500">{a.format.toUpperCase()}</td>
                  <td className="px-3 py-2 tabular-nums text-zinc-500">{a.track_count}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingId(a.id)}
                      className="mr-2 rounded px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(a)}
                      className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingId && (
        <AdminAlbumEditor
          albumId={editingId}
          onClose={() => {
            setEditingId(null);
            refresh();
          }}
          onSaved={(updated) => {
            setRows((prev) =>
              prev.map((r) =>
                r.id === updated.id
                  ? {
                      ...r,
                      title: updated.title,
                      year: updated.year,
                      country: updated.country,
                      format: updated.format,
                      cover_cf_image_id: updated.cover_cf_image_id,
                      catalog_number: updated.catalog_number,
                    }
                  : r,
              ),
            );
          }}
          onDeletedTrack={() => refresh()}
        />
      )}

      <DeleteConfirmDialog
        isOpen={Boolean(deleting)}
        title={`Eliminar álbum "${deleting?.title ?? ''}"`}
        description={
          deleting
            ? `Las ${deleting.track_count} canciones, sus archivos en R2 y todas las imágenes asociadas serán eliminados permanentemente.`
            : ''
        }
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteAlbum(deleting.id);
          if (res.ok) {
            setRows((prev) => prev.filter((r) => r.id !== deleting.id));
          } else {
            alert(res.error);
          }
        }}
      />
    </div>
  );
}
