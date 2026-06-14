'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

/** Lowercased + accent-stripped form for case/diacritic-insensitive matching. */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

interface GenreOption {
  id: string;
  name: string;
}

interface Props {
  genres: GenreOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Searchable single-select genre picker used in the admin club create modal:
 *  a filter input over an accessible listbox, plus the current selection. */
export function ClubGenreSelector({ genres, selectedId, onSelect }: Props) {
  const t = useTranslations('musica.admin.clubCreate');
  const [genreQuery, setGenreQuery] = useState('');

  const filteredGenres = useMemo(() => {
    const q = normalize(genreQuery.trim());
    if (!q) return genres;
    return genres.filter((g) => normalize(g.name).includes(q));
  }, [genres, genreQuery]);

  const selectedGenreName = useMemo(
    () => genres.find((g) => g.id === selectedId)?.name ?? '',
    [genres, selectedId],
  );

  if (genres.length === 0) {
    return (
      <p className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
        {t('noGenres')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={genreQuery}
        onChange={(e) => setGenreQuery(e.target.value)}
        placeholder={t('searchPlaceholder', { count: genres.length })}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        aria-label={t('searchAriaLabel')}
      />
      <div
        role="listbox"
        aria-label={t('listAriaLabel')}
        className="max-h-56 overflow-y-auto rounded-md border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {filteredGenres.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-zinc-500">
            {t('noMatches', { query: genreQuery })}
          </p>
        ) : (
          filteredGenres.map((g) => {
            const selected = g.id === selectedId;
            return (
              <button
                key={g.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(g.id)}
                className={
                  'block w-full rounded-sm px-2 py-1.5 text-left text-sm transition ' +
                  (selected
                    ? 'bg-amber-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800')
                }
              >
                {g.name}
              </button>
            );
          })
        )}
      </div>
      {selectedGenreName && (
        <p className="text-xs text-zinc-500">
          {t('selectedLabel')}{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-200">{selectedGenreName}</span>
        </p>
      )}
    </div>
  );
}
