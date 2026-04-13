'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { cacheKey, getCached, setCached, subscribe } from './cacheStore';

interface UseFetchOptions<T> {
  /** Skip the fetch entirely when false. */
  enabled?: boolean;
  /** Initial value while loading. */
  initialData?: T | null;
  /** Called when the fetch resolves successfully. */
  onSuccess?: (data: T) => void;
  /** Called when the fetch errors. */
  onError?: (error: Error) => void;
  /** How long (ms) a cached value is considered fresh; while fresh the fetcher is skipped. */
  staleTime?: number;
}

interface UseFetchResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  /** Alias of `isLoading` for callers migrating off TanStack. */
  isPending: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

type CachedRecord<T> = {
  data: T;
  fetchedAt: number;
};

/**
 * Native React data-fetching hook backed by a tiny module-level cache.
 * Replaces TanStack `useQuery` for our Next.js + InsForge stack.
 *
 * - Reads/writes go through `cacheStore` so multiple components hitting the
 *   same key share data and invalidations propagate.
 * - Refetches when `key` or `enabled` changes (in-flight requests cancelled).
 * - `staleTime` lets you skip the fetch when the cache is recent enough.
 *
 * Pass an array key (`['posts', id]`) for compound keys — it's flattened with
 * `cacheKey()` so the same logical entry shares cache regardless of caller.
 */
export function useFetch<T>(
  key: string | readonly (string | number | boolean | null | undefined)[],
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const { enabled = true, initialData = null, onSuccess, onError, staleTime = 0 } = options;
  const flatKey = Array.isArray(key) ? cacheKey(...key) : String(key);

  const cached = useSyncExternalStore(
    (listener) => subscribe(flatKey, listener),
    () => getCached<CachedRecord<T>>(flatKey),
    () => undefined
  );

  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(enabled && !cached);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const callbacksRef = useRef({ onSuccess, onError });
  callbacksRef.current = { onSuccess, onError };

  const run = useCallback(
    async (signal: AbortSignal) => {
      setIsFetching(true);
      try {
        const result = await fetcherRef.current(signal);
        if (signal.aborted) return;
        setCached<CachedRecord<T>>(flatKey, { data: result, fetchedAt: Date.now() });
        setError(null);
        callbacksRef.current.onSuccess?.(result);
      } catch (err) {
        if (signal.aborted) return;
        const wrapped = err instanceof Error ? err : new Error(String(err));
        setError(wrapped);
        callbacksRef.current.onError?.(wrapped);
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    },
    [flatKey]
  );

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Skip the fetch if the cached value is still within `staleTime`.
    const fresh =
      cached && staleTime > 0 ? Date.now() - cached.fetchedAt < staleTime : false;
    if (fresh) {
      setIsLoading(false);
      return;
    }

    setIsLoading(!cached);
    const controller = new AbortController();
    void run(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatKey, enabled]);

  const refetch = useCallback(async () => {
    const controller = new AbortController();
    await run(controller.signal);
  }, [run]);

  const data = cached?.data ?? initialData;
  return {
    data,
    error,
    isLoading,
    isPending: isLoading,
    isFetching,
    isSuccess: data !== null && error === null && !isLoading,
    isError: error !== null,
    refetch,
  };
}
