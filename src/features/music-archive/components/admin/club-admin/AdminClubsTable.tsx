'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useMemo, useState, useTransition } from 'react';
import {
  adminDeleteMusicClub,
  toggleClubForum,
} from '../../../actions/club-admin.actions';
import { useDebouncedValue } from '@/features/search/hooks/useDebouncedValue';
import { AdminClubEditModal, type AdminClubEditRow } from './AdminClubEditModal';
import {
  AdminClubCreateModal,
  type AdminClubCreatedRow,
} from './AdminClubCreateModal';
import { DeleteConfirmDialog } from '@/features/professional-profile/components/dialogs/DeleteConfirmDialog';

/** Lowercased + accent-stripped form for case/diacritic-insensitive matching.
 *  Mirrors the helper in AdminClubCreateModal.tsx — promote to a shared util
 *  if a third caller appears (rule of three). */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

interface ClubRow extends AdminClubEditRow {
  music_genre_id: string;
  genre_slug: string;
  genre_name: string;
  member_count: number;
  pending_count: number;
  post_count: number;
  article_count: number;
  forum_enabled: boolean;
}

interface GenreOption {
  id: string;
  name: string;
}

interface Props {
  initial: ClubRow[];
  /** Optional genre catalogue. When provided, the edit + create modals expose
   *  a genre selector. */
  genres?: GenreOption[];
}

export function AdminClubsTable({ initial, genres }: Props) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<ClubRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ClubRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [, startTransition] = useTransition();

  // Debounced + memoized client-side filter. The full list is already
  // pre-loaded, so this never hits the network — when row count grows past a
  // few hundred, swap to a server-side `searchAdminMusicClubs(query)` action
  // (pattern: useAdminEntitySearch) and keep the same `useDebouncedValue`.
  const debouncedQuery = useDebouncedValue(query, 250);
  const filteredRows = useMemo(() => {
    const q = normalize(debouncedQuery.trim());
    if (!q) return rows;
    const matches: Array<{ row: ClubRow; score: number }> = [];
    for (const row of rows) {
      const name = normalize(row.name);
      const genre = normalize(row.genre_name ?? '');
      const desc = normalize(row.description ?? '');
      if (name.includes(q)) matches.push({ row, score: 0 });
      else if (genre.includes(q)) matches.push({ row, score: 1 });
      else if (desc.includes(q)) matches.push({ row, score: 2 });
    }
    matches.sort((a, b) => a.score - b.score || a.row.name.localeCompare(b.row.name));
    return matches.map((m) => m.row);
  }, [rows, debouncedQuery]);

  const isFiltering = debouncedQuery.trim().length > 0;

  const genreSlugById = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.music_genre_id && r.genre_slug) map.set(r.music_genre_id, r.genre_slug);
    }
    return map;
  }, [rows]);

  function toggleForum(row: ClubRow) {
    setError(null);
    setPendingId(row.id);
    startTransition(async () => {
      const res = await toggleClubForum(row.id, !row.forum_enabled);
      setPendingId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, forum_enabled: !row.forum_enabled } : r)),
      );
    });
  }

  function appendCreated(row: AdminClubCreatedRow) {
    setRows((prev) => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function confirmDelete() {
    if (!deleting) return;
    setError(null);
    const id = deleting.id;
    const res = await adminDeleteMusicClub(id);
    if (!res.ok) {
      setError(res.error);
      throw new Error(res.error);
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isFiltering ? (
            <>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {filteredRows.length}
              </span>{' '}
              de {rows.length} {rows.length === 1 ? 'club' : 'clubes'}
              {' · filtro: '}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">
                &ldquo;{debouncedQuery.trim()}&rdquo;
              </span>
              {' '}
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-300"
              >
                limpiar
              </button>
            </>
          ) : (
            <>
              {rows.length} {rows.length === 1 ? 'club' : 'clubes'} registrados.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
        >
          + Crear club
        </button>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Buscar club por nombre, género o descripción… (${rows.length} disponibles)`}
        aria-label="Buscar club"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      {filteredRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          Ningún club coincide con &ldquo;{debouncedQuery.trim()}&rdquo;.{' '}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="font-medium text-amber-700 hover:underline dark:text-amber-300"
          >
            ¿Crear uno nuevo?
          </button>
        </div>
      ) : (
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {filteredRows.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <Link
                href={`/musica/clubes/${r.slug}` as Route}
                className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-300"
              >
                {r.name}
              </Link>
              <p className="text-xs text-zinc-500">
                {r.genre_name} · {r.member_count} miembros ·{' '}
                {r.pending_count > 0 && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    {r.pending_count} pendientes
                  </span>
                )}{' '}
                {r.post_count} posts · {r.article_count} artículos
              </p>
              <p className="line-clamp-2 text-xs text-zinc-500">{r.description}</p>
            </div>
            <div className="flex flex-none flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleForum(r)}
                disabled={pendingId === r.id}
                className={
                  'rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ' +
                  (r.forum_enabled
                    ? 'border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700')
                }
              >
                {pendingId === r.id
                  ? '…'
                  : r.forum_enabled
                  ? 'Deshabilitar foro'
                  : 'Habilitar foro'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(r)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setDeleting(r)}
                className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
      )}
      {editing && (
        <AdminClubEditModal
          club={editing}
          genres={genres}
          onClose={() => setEditing(null)}
          onSaved={(next) => {
            setRows((prev) => prev.map((r) => (r.id === next.id ? { ...r, ...next } : r)));
          }}
        />
      )}
      {creating && (
        <AdminClubCreateModal
          genres={genres ?? []}
          genreSlugById={genreSlugById}
          onClose={() => setCreating(false)}
          onCreated={appendCreated}
        />
      )}
      <DeleteConfirmDialog
        isOpen={Boolean(deleting)}
        title={deleting ? `Eliminar club "${deleting.name}"` : 'Eliminar club'}
        description={
          deleting
            ? `Se borrarán permanentemente ${deleting.member_count} miembros, ${deleting.post_count} publicaciones y ${deleting.article_count} artículos relacionados (los artículos quedan sin club asignado). Esta acción no se puede deshacer.`
            : ''
        }
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
