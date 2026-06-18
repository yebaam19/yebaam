'use client';

import { useEffect, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  linkClubToMusicGenre,
  listClubsPendingMusicActivation,
  type UnlinkedClubRow,
} from '../../../actions/club-settings.actions';
import type { ClubRow, GenreOption } from './admin-clubs-table.types';

interface Props {
  genres: GenreOption[];
  onActivated: (row: ClubRow) => void;
}

export function AdminActivateMusicClubPanel({ genres, onActivated }: Props) {
  const t = useTranslations('musica.admin.activateClub');
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState<UnlinkedClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [genreId, setGenreId] = useState(genres[0]?.id ?? '');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void listClubsPendingMusicActivation(query.length >= 2 ? query : undefined).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setError(res.error);
        setClubs([]);
      } else {
        setError(null);
        setClubs(res.data);
        setSelectedId(res.data.length === 1 ? res.data[0].id : null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  function activate() {
    if (!selectedId || !genreId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await linkClubToMusicGenre(selectedId, genreId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const activated = res.data;
      const row: ClubRow = {
        id: activated.id,
        name: activated.name,
        slug: activated.slug,
        description: activated.description,
        rules: activated.rules,
        cover_image_url: activated.cover_image_url,
        music_genre_id: activated.music_genre_id,
        genre_slug: activated.genre_slug,
        genre_name: activated.genre_name,
        member_count: 0,
        pending_count: 0,
        post_count: 0,
        article_count: 0,
        forum_enabled: false,
      };
      onActivated(row);
      setClubs((prev) => prev.filter((c) => c.id !== selectedId));
      setSelectedId(null);
      setSuccess(t('success', { name: activated.name }));
    });
  }

  if (genres.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('heading')}</h3>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{t('description')}</p>

      <div className="mt-3 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />

        {loading ? (
          <p className="text-xs text-zinc-500">{t('loading')}</p>
        ) : clubs.length === 0 ? (
          <p className="text-xs text-zinc-500">{t('empty')}</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            {clubs.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                  <input
                    type="radio"
                    name="unlinked-club"
                    checked={selectedId === c.id}
                    onChange={() => setSelectedId(c.id)}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                      {c.name}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      /{c.slug}
                      {c.category ? ` · ${c.category}` : ''}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t('genreLabel')}
          </label>
          <select
            value={genreId}
            onChange={(e) => setGenreId(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            {success}
          </p>
        )}

        <button
          type="button"
          onClick={activate}
          disabled={pending || !selectedId || !genreId}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? t('activating') : t('activateButton')}
        </button>
      </div>
    </div>
  );
}
