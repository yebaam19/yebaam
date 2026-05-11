'use client';

import { useEffect, useRef, useState } from 'react';
import { searchAlbumsForTag } from '../../actions/music-media.actions';

export interface AlbumRef {
  id: string;
  title: string;
  slug: string;
}

interface Props {
  value: AlbumRef[];
  onChange: (next: AlbumRef[]) => void;
  /** Max number of albums the caller can attach. */
  max?: number;
}

export function AlbumTagPicker({ value, onChange, max = 4 }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AlbumRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      const res = await searchAlbumsForTag(q);
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const taken = new Set(value.map((v) => v.id));
      setResults(res.data.filter((r) => !taken.has(r.id)));
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, value]);

  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        Álbumes asociados
      </label>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x.id !== a.id))}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {a.title} <span aria-hidden>✕</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {value.length < max && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar álbum por título…"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          {loading && <p className="mt-1 text-xs text-zinc-500">Buscando…</p>}
          {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
          {results.length > 0 && (
            <ul className="mt-1 max-h-48 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange([...value, r]);
                      setQuery('');
                      setResults([]);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-900/30"
                  >
                    {r.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
