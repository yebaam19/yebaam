'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import type { DebouncedFunc } from 'lodash';

export const SEARCH_DEBOUNCE_MS = 300;

/** Initialize timers after commit; handlers use current callbacks and expose cancel/flush. */
function useScheduledCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result, delay: number, mode: 'debounce' | 'throttle',
) {
  const latest = useRef(callback);
  const instance = useRef<DebouncedFunc<(...args: Args) => Result> | null>(null);
  useLayoutEffect(() => { latest.current = callback; }, [callback]);
  useLayoutEffect(() => {
    const invoke = (...args: Args) => latest.current(...args);
    const timer = mode === 'debounce' ? debounce(invoke, delay)
      : throttle(invoke, delay, { leading: true, trailing: true });
    instance.current = timer;
    return () => { timer.cancel(); instance.current = null; };
  }, [delay, mode]);
  return useMemo(() => {
    function run(...args: Args) { return instance.current?.(...args); }
    run.cancel = () => instance.current?.cancel();
    run.flush = () => instance.current?.flush();
    return run;
  }, []);
}

export function useDebouncedCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result, delay = SEARCH_DEBOUNCE_MS,
) { return useScheduledCallback(callback, delay, 'debounce'); }

export function useThrottledCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result, delay: number,
) { return useScheduledCallback(callback, delay, 'throttle'); }
