'use client';

import { useEffect, useState } from 'react';
import { usePreferencesStore } from '@/stores/preferences.store';

export function ThemeSync() {
  const theme = usePreferencesStore((s) => s.theme);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isDark = theme === 'dark' || (theme === 'system' && systemDark);
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme, systemDark]);

  return null;
}

export function useIsDarkMode(): boolean {
  const theme = usePreferencesStore((s) => s.theme);
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return theme === 'dark' || (theme === 'system' && systemDark);
}
