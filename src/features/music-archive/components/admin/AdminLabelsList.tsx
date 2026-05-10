'use client';

import { useState } from 'react';
import { DeleteConfirmDialog } from '@/features/professional-profile/components/dialogs';
import { deleteLabel, listAdminLabels } from '../../actions/music.actions';
import type { MusicLabelRow } from '../../types/music.types';
import { inputCls } from '../upload/constants';
import { useAdminEntitySearch } from './useAdminEntitySearch';
import { LabelFormDialog } from './dialogs/LabelFormDialog';

interface LabelRow {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  founded: number | null;
  album_count: number;
}

interface Props {
  initialLabels: LabelRow[];
}

/** Tab content: searchable list of all record labels with edit + delete + create. */
export function AdminLabelsList({ initialLabels }: Props) {
  const { query, setQuery, rows, setRows, pending, error, refresh } =
    useAdminEntitySearch<LabelRow>({
      initial: initialLabels,
      fetcher: listAdminLabels,
    });
  const [editing, setEditing] = useState<LabelRow | null>(null);
  const [deleting, setDeleting] = useState<LabelRow | null>(null);
  const [creating, setCreating] = useState(false);

  function rowFromLabel(l: MusicLabelRow): LabelRow {
    return {
      id: l.id,
      name: l.name,
      slug: l.slug,
      country: l.country,
      founded: l.founded,
      album_count: 0,
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar sello…"
          className={`${inputCls} max-w-md`}
        />
        <span className="text-xs text-zinc-500">
          {pending ? 'Buscando…' : `${rows.length} sellos`}
        </span>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="ml-auto rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700"
        >
          + Agregar sello
        </button>
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
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">País</th>
              <th className="px-3 py-2">Fundado</th>
              <th className="px-3 py-2">Álbumes</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-xs text-zinc-500">
                  {pending ? '…' : 'No hay sellos.'}
                </td>
              </tr>
            ) : (
              rows.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">{l.name}</td>
                  <td className="px-3 py-2 text-zinc-500">{l.country ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums text-zinc-500">{l.founded ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums text-zinc-500">{l.album_count}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(l)}
                      className="mr-2 rounded px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(l)}
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

      {creating && (
        <LabelFormDialog
          onClose={() => setCreating(false)}
          onSaved={(row) => {
            setRows((prev) => [rowFromLabel(row), ...prev]);
            setCreating(false);
            refresh();
          }}
        />
      )}

      {editing && (
        <LabelFormDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(row) => {
            setRows((prev) =>
              prev.map((r) =>
                r.id === row.id
                  ? { ...r, name: row.name, country: row.country, founded: row.founded }
                  : r,
              ),
            );
            setEditing(null);
          }}
        />
      )}

      <DeleteConfirmDialog
        isOpen={Boolean(deleting)}
        title={`Eliminar sello "${deleting?.name ?? ''}"`}
        description="Los álbumes asociados a este sello quedarán sin sello (no se eliminarán)."
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteLabel(deleting.id);
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
