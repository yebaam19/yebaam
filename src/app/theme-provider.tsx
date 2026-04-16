'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  isDarkMode: boolean
  toggleDarkMode: () => void
  themeDir: 'rtl' | 'ltr'
  setThemeDir: (value: 'rtl' | 'ltr') => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

const LEGACY_KEY = 'theme'
const STORAGE_KEY = 'theme-mode'

function readInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  const legacy = window.localStorage.getItem(LEGACY_KEY)
  if (legacy === 'dark-mode') return 'dark'
  if (legacy === 'light-mode') return 'light'
  return 'system'
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system')
  const [systemDark, setSystemDark] = useState(false)
  const [themeDir, setThemeDir] = useState<'rtl' | 'ltr'>('ltr')

  useEffect(() => {
    setThemeModeState(readInitialMode())
    setSystemDark(systemPrefersDark())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mounted])

  const isDarkMode = useMemo(
    () => themeMode === 'dark' || (themeMode === 'system' && systemDark),
    [themeMode, systemDark],
  )

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (isDarkMode) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [mounted, isDarkMode])

  useEffect(() => {
    if (!mounted) return
    window.localStorage.setItem(STORAGE_KEY, themeMode)
    window.localStorage.setItem(LEGACY_KEY, isDarkMode ? 'dark-mode' : 'light-mode')
  }, [mounted, themeMode, isDarkMode])

  useEffect(() => {
    if (!mounted) return
    setThemeDir(document.documentElement.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr')
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('dir', themeDir)
  }, [mounted, themeDir])

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode)
  }, [])

  const toggleDarkMode = useCallback(() => {
    setThemeModeState((prev) => {
      const effectiveDark = prev === 'dark' || (prev === 'system' && systemPrefersDark())
      return effectiveDark ? 'light' : 'dark'
    })
  }, [])

  if (!mounted) return null

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        isDarkMode,
        toggleDarkMode,
        themeDir,
        setThemeDir,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
