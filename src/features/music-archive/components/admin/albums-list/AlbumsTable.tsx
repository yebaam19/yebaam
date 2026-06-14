'use client';

import { useTranslations } from 'next-intl';
import { imageUrl } from '@/lib/media/urls';
import type { AdminAlbumListItem } from '../../../types/music.types';

interface Props {
  rows: AdminAlbumListItem[];
  selected: Set<string>;
  allOnPageSelected: boolean;
  pending: boolean;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (id: string) => void;
  onDelete: (row: AdminAlbumListItem) => void;
}

/** Presentational table for the admin albums list — header, the per-album
 *  rows, and the row-level select / edit / delete affordances. All state and
 *  mutations live in `AdminAlbumsList` and its hooks; this only renders. */
export function AlbumsTable({
  rows,
  selected,
  allOnPageSelected,
  pending,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations('musica.admin.albumsList');

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50">
          <tr>
            <th className="px-3 py-2">
              <input
                type="checkbox"
                aria-label={t('selectAllAria')}
                checked={allOnPageSelected}
                onChange={onSelectAll}
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
                    onChange={() => onToggleSelect(a.id)}
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
                    onClick={() => onEdit(a.id)}
                    className="mr-2 rounded px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                  >
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(a)}
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
  );
}
