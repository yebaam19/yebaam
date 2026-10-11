'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { usePreferencesStore } from '@/stores/preferences.store';

const query = '(prefers-color-scheme: dark)';
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const getSnapshot = () => window.matchMedia(query).matches;
const getServerSnapshot = () => false;

export function ThemeSync() {
  const isDark = useIsDarkMode();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  return null;
}

export function useIsDarkMode(): boolean {
  const theme = usePreferencesStore((s) => s.theme);
  const systemDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return theme === 'dark' || (theme === 'system' && systemDark);
}
