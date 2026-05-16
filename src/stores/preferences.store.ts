import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale, isLocale } from '@/i18n/locales';

export type ThemeMode = 'light' | 'dark' | 'system';

interface PreferencesState {
  theme: ThemeMode;
  locale: Locale;
  setTheme: (mode: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  toggleDarkMode: () => void;
}

const STORAGE_KEY = 'yebaam.preferences';
const LEGACY_THEME_KEY = 'theme-mode';
const LEGACY_LIGHT_DARK_KEY = 'theme';

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readLegacyTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(LEGACY_THEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  const legacy = window.localStorage.getItem(LEGACY_LIGHT_DARK_KEY);
  if (legacy === 'dark-mode') return 'dark';
  if (legacy === 'light-mode') return 'light';
  return null;
}

function writeLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

export const usePreferencesStore = create<PreferencesState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'system',
        locale: DEFAULT_LOCALE,
        setTheme: (mode) => set({ theme: mode }),
        setLocale: (locale) => {
          writeLocaleCookie(locale);
          set({ locale });
        },
        toggleDarkMode: () => {
          const { theme } = get();
          const effectiveDark =
            theme === 'dark' || (theme === 'system' && systemPrefersDark());
          set({ theme: effectiveDark ? 'light' : 'dark' });
        },
      }),
      {
        name: STORAGE_KEY,
        version: 1,
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          if (typeof window === 'undefined') return;
          const hasPersisted = window.localStorage.getItem(STORAGE_KEY) !== null;
          if (!hasPersisted) {
            const legacy = readLegacyTheme();
            if (legacy) state.theme = legacy;
          }
          window.localStorage.removeItem(LEGACY_THEME_KEY);
          window.localStorage.removeItem(LEGACY_LIGHT_DARK_KEY);
          const cookieLocale = readLocaleCookie();
          if (cookieLocale && cookieLocale !== state.locale) {
            state.locale = cookieLocale;
          } else {
            writeLocaleCookie(state.locale);
          }
        },
      },
    ),
    { name: 'PreferencesStore' },
  ),
);

function readLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`));
  const raw = match ? decodeURIComponent(match[1]) : null;
  return isLocale(raw) ? raw : null;
}
