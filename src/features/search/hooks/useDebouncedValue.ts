import { useEffect, useState } from 'react';

/**
 * Returns a value that only updates after `delay` ms of stillness.
 * Use to throttle expensive work (like API calls) tied to fast user input.
 */
export function useDebouncedValue<T>(value: T, delay: number = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
