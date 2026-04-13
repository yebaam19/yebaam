'use client';

import { useCallback, useRef, useState } from 'react';

interface UseAsyncActionOptions<TResult, TArgs> {
  onSuccess?: (data: TResult, args: TArgs) => void | Promise<void>;
  onError?: (error: Error, args: TArgs) => void | Promise<void>;
}

interface UseAsyncActionResult<TResult, TArgs> {
  run: (args: TArgs) => Promise<TResult>;
  /** Alias of `run` for callers migrating off TanStack `useMutation`. */
  mutateAsync: (args: TArgs) => Promise<TResult>;
  /** Fire-and-forget alias of `run`; throws are swallowed. */
  mutate: (args: TArgs) => void;
  data: TResult | null;
  error: Error | null;
  isPending: boolean;
  /** Alias of `isPending` for callers migrating off TanStack. */
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
}

/**
 * Native React hook for one-shot async actions (mutations / form submits).
 * Replaces TanStack `useMutation` for our Next.js + InsForge stack.
 *
 * Usage:
 *   const { run, isPending, error } = useAsyncAction(async (id: string) => {
 *     const res = await fetch(`/api/things/${id}`, { method: 'DELETE' });
 *     if (!res.ok) throw new Error('failed');
 *   });
 *   <button onClick={() => run('123')} disabled={isPending}>Delete</button>
 */
export function useAsyncAction<TResult, TArgs = void>(
  action: (args: TArgs) => Promise<TResult>,
  options: UseAsyncActionOptions<TResult, TArgs> = {}
): UseAsyncActionResult<TResult, TArgs> {
  const [data, setData] = useState<TResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const actionRef = useRef(action);
  actionRef.current = action;
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const run = useCallback(async (args: TArgs): Promise<TResult> => {
    setIsPending(true);
    setError(null);
    try {
      const result = await actionRef.current(args);
      setData(result);
      await callbacksRef.current.onSuccess?.(result, args);
      return result;
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      setError(wrapped);
      await callbacksRef.current.onError?.(wrapped, args);
      throw wrapped;
    } finally {
      setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsPending(false);
  }, []);

  const mutate = useCallback(
    (args: TArgs) => {
      void run(args).catch(() => undefined);
    },
    [run]
  );

  return {
    run,
    mutateAsync: run,
    mutate,
    data,
    error,
    isPending,
    isLoading: isPending,
    isSuccess: data !== null && error === null && !isPending,
    isError: error !== null,
    reset,
  };
}
