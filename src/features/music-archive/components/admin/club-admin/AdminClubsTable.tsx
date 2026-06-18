'use client';

import { useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  adminDeleteMusicClub,
  toggleClubForum,
} from '../../../actions/club-settings.actions';
import { useDebouncedValue } from '@/features/search/hooks/useDebouncedValue';
import { AdminClubEditModal } from './AdminClubEditModal';
import {
  AdminClubCreateModal,
  type AdminClubCreatedRow,
} from './AdminClubCreateModal';
import { DeleteConfirmDialog } from '@/features/professional-profile/components/dialogs/DeleteConfirmDialog';
import { AdminClubRow } from './AdminClubRow';
import { AdminActivateMusicClubPanel } from './AdminActivateMusicClubPanel';
import type { ClubRow, GenreOption } from './admin-clubs-table.types';

/** Lowercased + accent-stripped form for case/diacritic-insensitive matching.
 *  Mirrors the helper in AdminClubCreateModal.tsx — promote to a shared util
 *  if a third caller appears (rule of three). */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

interface Props {
  initial: ClubRow[];
  /** Optional genre catalogue. When provided, the edit + create modals expose
   *  a genre selector. */
  genres?: GenreOption[];
}

export function AdminClubsTable({ initial, genres }: Props) {
  const t = useTranslations('musica.admin.clubsTable');
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
      {genres && genres.length > 0 && (
        <AdminActivateMusicClubPanel
          genres={genres}
          onActivated={(row) => {
            setRows((prev) => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
          }}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isFiltering ? (
            <>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {filteredRows.length}
              </span>{' '}
              {t('filteredSummary', { total: rows.length })}
              {' · '}{t('filterLabel')}{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">
                &ldquo;{debouncedQuery.trim()}&rdquo;
              </span>
              {' '}
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-300"
              >
                {t('clearFilter')}
              </button>
            </>
          ) : (
            <>{t('registeredSummary', { count: rows.length })}</>
          )}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
        >
          {t('createCta')}
        </button>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchPlaceholder', { count: rows.length })}
        aria-label={t('searchAriaLabel')}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}
      {isFiltering && filteredRows.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          {t('noMatches', { query: debouncedQuery.trim() })}{' '}
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="font-medium text-amber-700 hover:underline dark:text-amber-300"
          >
            {t('createNewPrompt')}
          </button>
        </div>
      )}
      {filteredRows.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {filteredRows.map((r) => (
            <AdminClubRow
              key={r.id}
              row={r}
              pendingId={pendingId}
              onToggleForum={toggleForum}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
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
        title={deleting ? t('deleteDialogTitleWithName', { name: deleting.name }) : t('deleteDialogTitleGeneric')}
        description={
          deleting
            ? t('deleteDialogDescription', {
                memberCount: deleting.member_count,
                postCount: deleting.post_count,
                articleCount: deleting.article_count,
              })
            : ''
        }
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
