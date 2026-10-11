'use client';

import { useDebouncedMusicSearch } from './useDebouncedMusicSearch';
import { searchMusicTopHitsAction } from '../actions/search.actions';
import type { MusicSearchHit } from '../types/music.types';

interface State {
  hits: MusicSearchHit[];
  pending: boolean;
  error: string | null;
  /** true when the query met all gates and a fetch was actually issued. */
  hasQuery: boolean;
}

/** Module-level LRU cache. Survives across MusicSearchBar mounts so that
 *  navigating between pages doesn't re-issue queries the user just made.
 *  TTL 60s keeps content fresh enough — new uploads are rare in this archive. */
const MAX_CACHE = 50;
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; hits: MusicSearchHit[] }>();

function cacheGet(key: string): MusicSearchHit[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  // Refresh LRU order.
  cache.delete(key);
  cache.set(key, entry);
  return entry.hits;
}

function cacheSet(key: string, hits: MusicSearchHit[]): void {
  cache.set(key, { at: Date.now(), hits });
  if (cache.size > MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

interface Options {
  /** Skip queries shorter than this. Default 2 chars. */
  minLength?: number;
  /** Debounce window in ms before issuing a fetch. Default 300. */
  debounceMs?: number;
}

async function searchCached(query: string) {
  const cached = cacheGet(query);
  if (cached) return { ok: true as const, data: cached };
  const response = await searchMusicTopHitsAction(query);
  if (response.ok) cacheSet(query, response.data);
  return response;
}

/** Debounced search with a bounded TTL cache and stale-response protection. */
export function useSearchTopHits(query: string, options?: Options): State {
  const { results, loading, error, hasQuery } = useDebouncedMusicSearch(
    query.toLowerCase(), searchCached, options?.debounceMs ?? 300, options?.minLength ?? 2,
  );
  return { hits: results, pending: loading, error, hasQuery };
}
