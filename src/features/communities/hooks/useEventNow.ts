'use client';
import { useEffect, useState } from 'react';
/** Use the server snapshot during hydration, then keep date-based states current. */
export function useEventNow(initial: string) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().toISOString()), 60000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
