'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useState, useTransition } from 'react';
import { toggleClubForum } from '../../../actions/club-admin.actions';
import { AdminClubEditModal, type AdminClubEditRow } from './AdminClubEditModal';

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
  /** Optional genre catalogue. When provided, the edit modal exposes a genre
   *  selector so admins can reclassify the club. */
  genres?: GenreOption[];
}

export function AdminClubsTable({ initial, genres }: Props) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<ClubRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {rows.map((r) => (
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
            </div>
          </li>
        ))}
      </ul>
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
    </div>
  );
}
