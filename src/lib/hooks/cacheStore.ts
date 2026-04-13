'use client';

/**
 * Tiny module-level pub/sub cache built on plain Maps and the React 18
 * `useSyncExternalStore` primitive. Replaces the parts of TanStack Query we
 * actually used (cache reads/writes, invalidate, optimistic updates) without
 * adding a third-party dependency.
 *
 * - `getCached(key)` / `setCached(key, value)` — direct read/write
 * - `invalidate(prefix)` — drops every cached entry whose key starts with `prefix`
 * - `useCachedValue(key, fallback)` — subscribes a component to a key
 *
 * Cache keys are flat strings; for compound keys, JSON-stringify in the caller.
 */

type Listener = () => void;

const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();

function notify(key: string): void {
  const set = listeners.get(key);
  if (!set) return;
  for (const cb of set) cb();
}

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCached<T>(key: string, value: T): void {
  cache.set(key, value);
  notify(key);
}

export function updateCached<T>(key: string, updater: (prev: T | undefined) => T): void {
  const next = updater(cache.get(key) as T | undefined);
  cache.set(key, next);
  notify(key);
}

export function clearCached(key: string): void {
  cache.delete(key);
  notify(key);
}

/** Drops every key that starts with the given prefix and notifies subscribers. */
export function invalidate(prefix: string): void {
  for (const key of Array.from(cache.keys())) {
    if (key === prefix || key.startsWith(`${prefix}::`)) {
      cache.delete(key);
      notify(key);
    }
  }
}

export function subscribe(key: string, listener: Listener): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listeners.delete(key);
  };
}

/** Build a stable cache key from any number of segments. */
export function cacheKey(...parts: ReadonlyArray<string | number | boolean | null | undefined>): string {
  return parts.filter((p) => p !== undefined && p !== null).join('::');
}
