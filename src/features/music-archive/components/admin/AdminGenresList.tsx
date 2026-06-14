'use client';

import { useTranslations } from 'next-intl';
import type { AdminGenreRow } from './admin-genres.types';
import { useAdminGenres } from './useAdminGenres';

export type { AdminGenreRow };

interface Props {
  initial: AdminGenreRow[];
}

export function AdminGenresList({ initial }: Props) {
  const t = useTranslations('musica.admin.genresList');
  const {
    rows,
    error,
    editingId,
    setEditingId,
    draftName,
    setDraftName,
    draftDesc,
    setDraftDesc,
    draftOrder,
    setDraftOrder,
    creating,
    setCreating,
    newName,
    setNewName,
    newDesc,
    setNewDesc,
    pending,
    beginEdit,
    saveEdit,
    handleDelete,
    handleCreate,
  } = useAdminGenres(initial);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t('summary', {
            count: rows.length,
            clubCount: rows.reduce((sum, r) => sum + r.club_count, 0),
          })}
        </p>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            {t('newCta')}
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
              placeholder={t('namePlaceholder')}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder={t('descPlaceholder')}
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
              {t('create')}
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
              {t('cancel')}
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
                    placeholder={t('editDescPlaceholder')}
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
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                  >
                    {t('cancel')}
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
                  <span className="text-xs text-zinc-500">{t('orderLabel', { order: r.sort_order })}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {t('clubsCount', { count: r.club_count })}
                  </span>
                  <button
                    type="button"
                    onClick={() => beginEdit(r)}
                    className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r)}
                    disabled={r.club_count > 0}
                    title={r.club_count > 0 ? t('deleteDisabledTitle') : ''}
                    className="rounded-md border border-rose-300 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-30 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                  >
                    {t('delete')}
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
