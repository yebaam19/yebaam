'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog } from '@/features/professional-profile/components/dialogs';
import { deleteAlbum, listAdminAlbums } from '../../actions/albums.actions';
import type { AdminAlbumListItem } from '../../types/music.types';
import { inputCls } from '../upload/constants';
import { useAdminEntitySearch } from './useAdminEntitySearch';
import { useAlbumBulkSelection } from './albums-list/useAlbumBulkSelection';
import { AlbumsTable } from './albums-list/AlbumsTable';
import { AdminAlbumEditor } from './AdminAlbumEditor';

interface Props {
  initialAlbums: AdminAlbumListItem[];
}

export function AdminAlbumsList({ initialAlbums }: Props) {
  const t = useTranslations('musica.admin.albumsList');
  const { query, setQuery, rows, setRows, pending, error, refresh } =
    useAdminEntitySearch<AdminAlbumListItem>({
      initial: initialAlbums,
      fetcher: listAdminAlbums,
    });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminAlbumListItem | null>(null);
  const {
    selected,
    toggleSelect,
    selectAllOnPage,
    clearSelection,
    applyBulkForTrade,
    allOnPageSelected,
    bulkPending,
    bulkError,
  } = useAlbumBulkSelection({ rows, setRows });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className={`${inputCls} max-w-md`}
        />
        <span className="text-xs text-zinc-500">
          {pending ? t('searching') : t('countLabel', { count: rows.length })}
        </span>
        <span className="ml-auto text-xs text-zinc-500">
          {t.rich('uploadHint', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </span>
      </div>
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-700 dark:bg-amber-900/20">
          <span className="font-medium text-amber-900 dark:text-amber-100">
            {t('selectedCount', { count: selected.size })}
          </span>
          <button
            type="button"
            onClick={() => applyBulkForTrade(true)}
            disabled={bulkPending}
            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            {t('markForTrade')}
          </button>
          <button
            type="button"
            onClick={() => applyBulkForTrade(false)}
            disabled={bulkPending}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {t('unmarkForTrade')}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="ml-auto text-xs text-amber-800 hover:underline dark:text-amber-200"
          >
            {t('clearSelection')}
          </button>
        </div>
      )}
      {bulkError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {bulkError}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <AlbumsTable
        rows={rows}
        selected={selected}
        allOnPageSelected={allOnPageSelected}
        pending={pending}
        onToggleSelect={toggleSelect}
        onSelectAll={selectAllOnPage}
        onEdit={setEditingId}
        onDelete={setDeleting}
      />

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
                      condition: updated.condition,
                      for_trade: Boolean(updated.for_trade),
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
        title={t('deleteTitle', { title: deleting?.title ?? '' })}
        description={
          deleting
            ? t('deleteDescription', { count: deleting.track_count })
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
