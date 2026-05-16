'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog } from '@/features/professional-profile/components/dialogs';
import { imageUrl } from '@/lib/media/urls';
import { deleteArtist, listAdminArtists } from '../../actions/artists.actions';
import type { MusicArtistRow } from '../../types/music.types';
import { inputCls } from '../upload/constants';
import { useAdminEntitySearch } from './useAdminEntitySearch';
import { ArtistFormDialog } from './dialogs/ArtistFormDialog';

interface ArtistRow {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  born_year: number | null;
  died_year: number | null;
  bio_short: string | null;
  photo_cf_image_id: string | null;
  album_count: number;
}

interface Props {
  initialArtists: ArtistRow[];
}

/** Tab content: searchable list of all artists with edit + delete + create. */
export function AdminArtistsList({ initialArtists }: Props) {
  const t = useTranslations('musica.admin.artistsList');
  const { query, setQuery, rows, setRows, pending, error, refresh } =
    useAdminEntitySearch<ArtistRow>({
      initial: initialArtists,
      fetcher: listAdminArtists,
    });
  const [editing, setEditing] = useState<ArtistRow | null>(null);
  const [deleting, setDeleting] = useState<ArtistRow | null>(null);
  const [creating, setCreating] = useState(false);

  function rowFromArtist(a: MusicArtistRow): ArtistRow {
    return {
      id: a.id,
      name: a.name,
      slug: a.slug,
      country: a.country,
      born_year: a.born_year,
      died_year: a.died_year,
      bio_short: a.bio_short,
      photo_cf_image_id: a.photo_cf_image_id,
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
          placeholder={t('searchPlaceholder')}
          className={`${inputCls} max-w-md`}
        />
        <span className="text-xs text-zinc-500">
          {pending ? t('searching') : t('countLabel', { count: rows.length })}
        </span>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="ml-auto rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700"
        >
          {t('addCta')}
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
              <th className="px-3 py-2">{t('colPhoto')}</th>
              <th className="px-3 py-2">{t('colName')}</th>
              <th className="px-3 py-2">{t('colCountry')}</th>
              <th className="px-3 py-2">{t('colLife')}</th>
              <th className="px-3 py-2">{t('colAlbums')}</th>
              <th className="px-3 py-2 text-right">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-xs text-zinc-500">
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
                    {a.photo_cf_image_id ? (
                      <img
                        src={imageUrl(a.photo_cf_image_id, 'avatar')}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">{a.name}</td>
                  <td className="px-3 py-2 text-zinc-500">{a.country ?? t('fieldEmpty')}</td>
                  <td className="px-3 py-2 tabular-nums text-zinc-500">
                    {a.born_year || a.died_year
                      ? `${a.born_year ?? '?'}–${a.died_year ?? '?'}`
                      : t('fieldEmpty')}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-zinc-500">{a.album_count}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(a)}
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

      {creating && (
        <ArtistFormDialog
          onClose={() => setCreating(false)}
          onSaved={(row) => {
            setRows((prev) => [rowFromArtist(row), ...prev]);
            setCreating(false);
            refresh();
          }}
        />
      )}

      {editing && (
        <ArtistFormDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(row) => {
            setRows((prev) =>
              prev.map((r) =>
                r.id === row.id
                  ? { ...r, name: row.name, country: row.country, born_year: row.born_year, died_year: row.died_year, bio_short: row.bio_short, photo_cf_image_id: row.photo_cf_image_id }
                  : r,
              ),
            );
            setEditing(null);
          }}
        />
      )}

      <DeleteConfirmDialog
        isOpen={Boolean(deleting)}
        title={t('deleteTitle', { name: deleting?.name ?? '' })}
        description={
          deleting && deleting.album_count > 0
            ? t('deleteDescriptionWithAlbums', { count: deleting.album_count })
            : t('deleteDescriptionNoCascade')
        }
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteArtist(deleting.id);
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
