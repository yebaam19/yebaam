'use client';

import { useEffect, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedCallback } from './useScheduledCallback';

/** Debounce waits for a pause; throttle is reserved for continuous events such as resize. */
export function useDebouncedValue<T>(value: T, delay = SEARCH_DEBOUNCE_MS, initialValue = value): T {
  const [debounced, setDebounced] = useState<T>(() => initialValue);
  const schedule = useDebouncedCallback((next: T) => setDebounced(() => next), delay);
  useEffect(() => { schedule(value); return () => schedule.cancel(); }, [value, delay, schedule]);
  return debounced;
}
