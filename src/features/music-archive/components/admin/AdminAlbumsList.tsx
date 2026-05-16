'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog } from '@/features/professional-profile/components/dialogs';
import { imageUrl } from '@/lib/media/urls';
import {
  bulkToggleForTrade,
  deleteAlbum,
  listAdminAlbums,
} from '../../actions/albums.actions';
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
  condition: string | null;
  for_trade: boolean;
  artist_id: string;
  artist_name: string;
  track_count: number;
}

interface Props {
  initialAlbums: AlbumRow[];
}

export function AdminAlbumsList({ initialAlbums }: Props) {
  const t = useTranslations('musica.admin.albumsList');
  const { query, setQuery, rows, setRows, pending, error, refresh } =
    useAdminEntitySearch<AlbumRow>({
      initial: initialAlbums,
      fetcher: listAdminAlbums,
    });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AlbumRow | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPending, startBulkTransition] = useTransition();
  const [bulkError, setBulkError] = useState<string | null>(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllOnPage(visible: AlbumRow[]) {
    setSelected((prev) => {
      const allSelected = visible.every((r) => prev.has(r.id));
      if (allSelected) return new Set();
      const next = new Set(prev);
      for (const r of visible) next.add(r.id);
      return next;
    });
  }

  function applyBulkForTrade(forTrade: boolean) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkError(null);
    startBulkTransition(async () => {
      const res = await bulkToggleForTrade(ids, forTrade);
      if (!res.ok) {
        setBulkError(res.error);
        return;
      }
      setRows((prev) =>
        prev.map((r) => (selected.has(r.id) ? { ...r, for_trade: forTrade } : r)),
      );
      setSelected(new Set());
    });
  }

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

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
            onClick={() => setSelected(new Set())}
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
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  aria-label={t('selectAllAria')}
                  checked={allOnPageSelected}
                  onChange={() => selectAllOnPage(rows)}
                />
              </th>
              <th className="px-3 py-2">{t('colCover')}</th>
              <th className="px-3 py-2">{t('colTitle')}</th>
              <th className="px-3 py-2">{t('colArtist')}</th>
              <th className="px-3 py-2">{t('colYear')}</th>
              <th className="px-3 py-2">{t('colCountry')}</th>
              <th className="px-3 py-2">{t('colFormat')}</th>
              <th className="px-3 py-2">{t('colTracks')}</th>
              <th className="px-3 py-2">{t('colTrade')}</th>
              <th className="px-3 py-2 text-right">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-xs text-zinc-500">
                  {pending ? '…' : t('empty')}
                </td>
              </tr>
            ) : (
              rows.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      aria-label={t('selectRowAria', { title: a.title })}
                    />
                  </td>
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
                  <td className="px-3 py-2 tabular-nums text-zinc-500">{a.year ?? t('fieldEmpty')}</td>
                  <td className="px-3 py-2 text-zinc-500">{a.country ?? t('fieldEmpty')}</td>
                  <td className="px-3 py-2 text-zinc-500">{a.format.toUpperCase()}</td>
                  <td className="px-3 py-2 tabular-nums text-zinc-500">{a.track_count}</td>
                  <td className="px-3 py-2">
                    {a.for_trade ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                        {t('tradeYes')}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">{t('fieldEmpty')}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingId(a.id)}
                      className="mr-2 rounded px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                    >
                      {t('edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(a)}
                      className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                      {t('delete')}
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
