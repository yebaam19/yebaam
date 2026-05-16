'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useMemo, useState } from 'react';
import { pillClass } from '@/features/music-archive/lib/pill-class';
import {
  GENRE_FAMILIES,
  type FamilyId,
  genreFamilyOf,
  normalizeForSearch,
} from '@/features/music-archive/lib/genre-families';

interface GenreItem {
  id: string;
  slug: string;
  name: string;
}

interface GenreBrowserProps {
  genres: GenreItem[];
  activeSlug?: string;
  currentParams: {
    decade?: number;
    country?: string;
    forTrade: boolean;
    condition?: string;
  };
}

const MAX_SEARCH_RESULTS = 60;

function buildGenreHref(
  params: GenreBrowserProps['currentParams'],
  genreSlug: string | undefined,
): Route {
  const qs = new URLSearchParams();
  if (params.decade !== undefined) qs.set('decade', String(params.decade));
  if (params.country) qs.set('country', params.country);
  if (params.forTrade) qs.set('trade', '1');
  if (genreSlug) qs.set('genre', genreSlug);
  if (params.condition) qs.set('condition', params.condition);
  const s = qs.toString();
  return (s ? `/musica?${s}` : '/musica') as Route;
}

export function GenreBrowser({ genres, activeSlug, currentParams }: GenreBrowserProps) {
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const map = new Map<FamilyId, GenreItem[]>();
    for (const g of genres) {
      const family = genreFamilyOf(g.slug);
      const list = map.get(family);
      if (list) list.push(g);
      else map.set(family, [g]);
    }
    return map;
  }, [genres]);

  const activeFamily: FamilyId | null = activeSlug ? genreFamilyOf(activeSlug) : null;

  const normalizedQuery = normalizeForSearch(query.trim());
  const isSearching = normalizedQuery.length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const familyOrder = new Map(GENRE_FAMILIES.map((f, i) => [f.id, i]));
    const matches = genres
      .filter((g) => normalizeForSearch(g.name).includes(normalizedQuery))
      .map((g) => ({ ...g, family: genreFamilyOf(g.slug) }));
    matches.sort((a, b) => {
      const fa = familyOrder.get(a.family) ?? 999;
      const fb = familyOrder.get(b.family) ?? 999;
      if (fa !== fb) return fa - fb;
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });
    return matches;
  }, [genres, normalizedQuery, isSearching]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Género</h2>
        <label className="relative block w-full max-w-xs">
          <span className="sr-only">Buscar género</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar género…"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
          />
        </label>
      </div>

      {isSearching ? (
        <SearchResults
          results={searchResults}
          activeSlug={activeSlug}
          currentParams={currentParams}
        />
      ) : (
        <div className="space-y-1.5">
          {GENRE_FAMILIES.map((family) => {
            const list = grouped.get(family.id);
            if (!list || list.length === 0) return null;
            const forceOpen = activeFamily === family.id;
            return (
              <FamilyAccordion
                key={family.id}
                label={family.label}
                count={list.length}
                defaultOpen={family.defaultOpen || forceOpen}
                items={list}
                activeSlug={activeSlug}
                currentParams={currentParams}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

interface FamilyAccordionProps {
  label: string;
  count: number;
  defaultOpen: boolean;
  items: GenreItem[];
  activeSlug?: string;
  currentParams: GenreBrowserProps['currentParams'];
}

function FamilyAccordion({
  label,
  count,
  defaultOpen,
  items,
  activeSlug,
  currentParams,
}: FamilyAccordionProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-zinc-200/70 bg-white/40 dark:border-zinc-800/70 dark:bg-zinc-900/30"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/40">
        <span className="flex items-center gap-2">
          <Chevron />
          {label}
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">({count})</span>
        </span>
      </summary>
      <div className="flex flex-wrap gap-2 px-3 pb-3 pt-1">
        {items.map((g) => {
          const active = activeSlug === g.slug;
          return (
            <Link
              key={g.id}
              href={buildGenreHref(currentParams, active ? undefined : g.slug)}
              className={pillClass(active)}
              aria-pressed={active}
            >
              {g.name}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

interface SearchResultsProps {
  results: Array<GenreItem & { family: FamilyId }>;
  activeSlug?: string;
  currentParams: GenreBrowserProps['currentParams'];
}

function SearchResults({ results, activeSlug, currentParams }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 px-3 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Sin géneros que coincidan.
      </p>
    );
  }
  const labelOf = new Map(GENRE_FAMILIES.map((f) => [f.id, f.label]));
  const visible = results.slice(0, MAX_SEARCH_RESULTS);
  const overflow = results.length - visible.length;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {visible.map((g) => {
          const active = activeSlug === g.slug;
          return (
            <Link
              key={g.id}
              href={buildGenreHref(currentParams, active ? undefined : g.slug)}
              className={`${pillClass(active)} inline-flex items-center gap-1.5`}
              aria-pressed={active}
            >
              <span>{g.name}</span>
              <span className="text-[10px] font-normal uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {labelOf.get(g.family)}
              </span>
            </Link>
          );
        })}
      </div>
      {overflow > 0 && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          …y {overflow} más, refina tu búsqueda.
        </p>
      )}
    </>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="h-3 w-3 shrink-0 text-zinc-400 transition-transform group-open:rotate-90 dark:text-zinc-500"
    >
      <path d="M4 2.5L8 6L4 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
