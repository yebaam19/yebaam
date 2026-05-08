'use client';

import { useEffect, useState } from 'react';

const QUERY = '(min-width: 1280px)';

export function useIsXl(): boolean {
  const [isXl, setIsXl] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(QUERY);
    const update = () => setIsXl(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return isXl;
}
