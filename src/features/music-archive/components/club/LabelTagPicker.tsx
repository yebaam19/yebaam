'use client';

import { useEffect, useRef, useState } from 'react';
import { searchLabelsForTag } from '../../actions/music-articles.actions';

interface LabelRef {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  value: LabelRef[];
  onChange: (next: LabelRef[]) => void;
}

/** Multi-select with debounced autocomplete for record labels. Mirrors
 *  ArtistTagPicker — kept as a sibling component on purpose (the two are
 *  edited independently and merging them would obscure the simple flow). */
export function LabelTagPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LabelRef[]>([]);
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
      const res = await searchLabelsForTag(q);
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

  function add(l: LabelRef) {
    onChange([...value, l]);
    setQuery('');
    setResults([]);
  }

  function remove(id: string) {
    onChange(value.filter((l) => l.id !== id));
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        Sellos etiquetados
      </label>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => remove(l.id)}
                className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs text-sky-900 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200"
              >
                {l.name} <span aria-hidden>✕</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar sello por nombre…"
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
                onClick={() => add(r)}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-sky-50 dark:hover:bg-sky-900/30"
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
