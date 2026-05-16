'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { searchArtistsForTag } from '../../actions/music-articles.actions';

interface ArtistRef {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  value: ArtistRef[];
  onChange: (next: ArtistRef[]) => void;
}

/** Multi-select with debounced autocomplete. Click chip → remove. Tab/enter →
 *  accept first suggestion. Used by the article editor to pick which artists
 *  the article is "about" so back-refs surface on those artist pages. */
export function ArtistTagPicker({ value, onChange }: Props) {
  const t = useTranslations('musica.tags.artists');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArtistRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchArtistsForTag(q);
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        setResults([]);
        return;
      }
      const selectedIds = new Set(value.map((v) => v.id));
      setResults(res.data.filter((r) => !selectedIds.has(r.id)));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, value]);

  function add(a: ArtistRef) {
    onChange([...value, a]);
    setQuery('');
    setResults([]);
  }

  function remove(id: string) {
    onChange(value.filter((a) => a.id !== id));
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        {t('label')}
      </label>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => remove(a.id)}
                aria-label={t('removeAria')}
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
              >
                {a.name} <span aria-hidden>✕</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      {loading && <p className="mt-1 text-xs text-zinc-500">{t('searching')}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {results.length > 0 && (
        <ul className="mt-1 max-h-48 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => add(r)}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-900/30"
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
