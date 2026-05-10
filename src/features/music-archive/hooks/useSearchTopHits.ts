'use client';

import { useEffect, useRef, useState } from 'react';
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

/** Search-as-you-type with the four techniques that matter for cost control:
 *  - **Debounce** so quick keystrokes coalesce.
 *  - **Min-length gate** so single-letter queries don't fire.
 *  - **AbortController** so a stale request never overwrites a newer result.
 *  - **LRU cache** so repeated queries (back/forward, retyping) don't re-hit
 *    the server.
 *  Returns just data + status — the bar component owns the UI state. */
export function useSearchTopHits(query: string, options?: Options): State {
  const minLength = options?.minLength ?? 2;
  const debounceMs = options?.debounceMs ?? 300;

  const [state, setState] = useState<State>({
    hits: [],
    pending: false,
    error: null,
    hasQuery: false,
  });

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic id so an old in-flight resolution that races past the abort
  // can't still overwrite the newest state.
  const tickRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < minLength) {
      // Cancel any pending request and reset.
      if (abortRef.current) abortRef.current.abort();
      setState({ hits: [], pending: false, error: null, hasQuery: false });
      return;
    }

    // Synchronous cache hit — no fetch, no debounce, no flicker.
    const cached = cacheGet(trimmed);
    if (cached) {
      if (abortRef.current) abortRef.current.abort();
      setState({ hits: cached, pending: false, error: null, hasQuery: true });
      return;
    }

    setState((prev) => ({ ...prev, pending: true, error: null, hasQuery: true }));

    debounceRef.current = setTimeout(() => {
      // Each fetch gets a fresh AbortController; abort the previous one.
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const myTick = ++tickRef.current;

      // Server actions don't natively respect AbortController, but we honour
      // it here by discarding the response if a newer fetch has started or
      // the controller was aborted.
      void searchMusicTopHitsAction(trimmed)
        .then((res) => {
          if (controller.signal.aborted) return;
          if (tickRef.current !== myTick) return;
          if (!res.ok) {
            setState({ hits: [], pending: false, error: res.error, hasQuery: true });
            return;
          }
          cacheSet(trimmed, res.data);
          setState({ hits: res.data, pending: false, error: null, hasQuery: true });
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          if (tickRef.current !== myTick) return;
          setState({
            hits: [],
            pending: false,
            error: err instanceof Error ? err.message : 'Error de búsqueda',
            hasQuery: true,
          });
        });
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, minLength, debounceMs]);

  // Abort any in-flight request when the component unmounts.
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return state;
}
