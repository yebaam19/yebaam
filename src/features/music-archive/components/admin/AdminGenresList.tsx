'use client';

import { useState, useTransition } from 'react';
import { createGenre, deleteGenre, updateGenre } from '../../actions/genres.actions';

export interface AdminGenreRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  club_count: number;
}

interface Props {
  initial: AdminGenreRow[];
}

export function AdminGenresList({ initial }: Props) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftOrder, setDraftOrder] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [pending, startTransition] = useTransition();

  function beginEdit(row: AdminGenreRow) {
    setEditingId(row.id);
    setDraftName(row.name);
    setDraftDesc(row.description ?? '');
    setDraftOrder(String(row.sort_order));
    setError(null);
  }

  function saveEdit(row: AdminGenreRow) {
    setError(null);
    startTransition(async () => {
      const res = await updateGenre(row.id, {
        name: draftName,
        description: draftDesc.trim() ? draftDesc : null,
        sortOrder: Number(draftOrder) || row.sort_order,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((prev) =>
        prev
          .map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  name: res.data.name,
                  description: res.data.description,
                  sort_order: res.data.sort_order,
                }
              : r,
          )
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
      );
      setEditingId(null);
    });
  }

  function handleDelete(row: AdminGenreRow) {
    if (
      !confirm(
        `Borrar el género "${row.name}"? Solo se permite si ningún club lo usa (${row.club_count} actualmente).`,
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await deleteGenre(row.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    });
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const res = await createGenre({
        name: newName,
        description: newDesc.trim() || undefined,
        sortOrder: 999,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((prev) =>
        [
          ...prev,
          {
            id: res.data.id,
            slug: res.data.slug,
            name: res.data.name,
            description: res.data.description,
            sort_order: res.data.sort_order,
            club_count: 0,
          },
        ].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
      );
      setCreating(false);
      setNewName('');
      setNewDesc('');
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {rows.length} géneros · usados por {rows.reduce((sum, r) => sum + r.club_count, 0)} clubes
        </p>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Nuevo género
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      {creating && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3 dark:border-amber-700 dark:bg-amber-900/20">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre (ej. Música árabe)"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Descripción corta (opcional)"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={pending || newName.trim().length < 2}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-40"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setNewName('');
                setNewDesc('');
              }}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {rows.map((r) => {
          const isEditing = editingId === r.id;
          return (
            <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
              {isEditing ? (
                <>
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <input
                    value={draftDesc}
                    onChange={(e) => setDraftDesc(e.target.value)}
                    placeholder="Descripción"
                    className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <input
                    type="number"
                    value={draftOrder}
                    onChange={(e) => setDraftOrder(e.target.value)}
                    className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(r)}
                    disabled={pending}
                    className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-40"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {r.name}
                      <span className="ml-2 font-mono text-[11px] text-zinc-500">{r.slug}</span>
                    </p>
                    {r.description && (
                      <p className="line-clamp-1 text-xs text-zinc-500">{r.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">orden: {r.sort_order}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {r.club_count} club{r.club_count === 1 ? '' : 'es'}
                  </span>
                  <button
                    type="button"
                    onClick={() => beginEdit(r)}
                    className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r)}
                    disabled={r.club_count > 0}
                    title={r.club_count > 0 ? 'No se puede borrar mientras hay clubes con este género' : ''}
                    className="rounded-md border border-rose-300 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-30 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                  >
                    Borrar
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
