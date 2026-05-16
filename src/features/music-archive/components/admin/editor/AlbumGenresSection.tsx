'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  getAlbumClubAssignments,
  listMusicClubsForPicker,
  setAlbumClubs,
} from '../../../actions/album_clubs.actions';

interface ClubOption {
  id: string;
  name: string;
  slug: string;
  genre_slug: string;
  genre_name: string;
}

interface Props {
  albumId: string;
}

/** Inline section inside the AdminAlbumEditor modal that lists every music-
 *  category club (genre) with a checkbox + a "Primario" radio. Calls
 *  `setAlbumClubs` to atomically replace the album's club set + primary. */
export function AlbumGenresSection({ albumId }: Props) {
  const t = useTranslations('musica.admin.albumGenres');
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Load the club list + the album's current assignments once on mount.
  useEffect(() => {
    let cancelled = false;
    void Promise.all([listMusicClubsForPicker(), getAlbumClubAssignments(albumId)]).then(
      ([list, current]) => {
        if (cancelled) return;
        if (list.ok) setClubs(list.data);
        else setError(list.error);
        if (current.ok) {
          setSelectedIds(new Set(current.data.clubIds));
          setPrimaryId(current.data.primaryClubId);
        }
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [albumId]);

  function toggle(id: string) {
    setSaved(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (primaryId === id) setPrimaryId(null);
      } else {
        next.add(id);
        if (!primaryId) setPrimaryId(id);
      }
      return next;
    });
  }

  function makePrimary(id: string) {
    setSaved(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setPrimaryId(id);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await setAlbumClubs(
      albumId,
      Array.from(selectedIds),
      primaryId && selectedIds.has(primaryId) ? primaryId : null,
    );
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
  }

  if (loading) return <p className="text-xs text-zinc-500">{t('loading')}</p>;

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{t('heading')}</h4>
        <span className="text-[11px] text-zinc-500">
          {t('summary', { count: selectedIds.size })}
        </span>
      </div>
      {error && (
        <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {clubs.map((c) => {
          const selected = selectedIds.has(c.id);
          const isPrimary = primaryId === c.id;
          return (
            <div
              key={c.id}
              className={`flex items-center justify-between gap-1 rounded-md border px-2 py-1.5 text-xs ${
                selected
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30'
                  : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <label className="flex flex-1 cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(c.id)}
                  className="h-3.5 w-3.5"
                />
                <span className="truncate">{c.genre_name || c.name}</span>
              </label>
              {selected && (
                <button
                  type="button"
                  onClick={() => makePrimary(c.id)}
                  className={`shrink-0 rounded px-1 text-base leading-none ${
                    isPrimary
                      ? 'text-amber-600'
                      : 'text-zinc-300 hover:text-amber-500 dark:text-zinc-600'
                  }`}
                  title={t('primaryTitle')}
                  aria-label={isPrimary ? t('primaryAria') : t('markPrimaryAria')}
                >
                  ★
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {saving ? t('saving') : t('save')}
        </button>
        {saved && <span className="text-xs text-emerald-600">{t('saved')}</span>}
      </div>
    </div>
  );
}
