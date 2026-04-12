'use client'

import { createContext, useCallback, useEffect, useState } from 'react'

interface ThemeContextValue {
  isDarkMode: boolean
  toggleDarkMode: () => void
  themeDir: 'rtl' | 'ltr'
  setThemeDir: (value: 'rtl' | 'ltr') => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [themeDir, setThemeDir] = useState<'rtl' | 'ltr'>('ltr')
  const [mounted, setMounted] = useState(false)

  // Marcar como montado cuando el componente se monta en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // themeMode
  useEffect(() => {
    if (!mounted) return
    
    if (localStorage.getItem('theme') === 'dark-mode') {
      setIsDarkMode(true)
      const root = document.querySelector('html')
      if (root && !root.classList.contains('dark')) {
        root.classList.add('dark')
      }
    } else {
      setIsDarkMode(false)
      const root = document.querySelector('html')
      if (root) {
        root.classList.remove('dark')
      }
    }
  }, [mounted])

  // themeDir
  useEffect(() => {
    if (!mounted) return
    
    if (typeof window !== 'undefined') {
      document.documentElement.getAttribute('dir') === 'rtl' ? setThemeDir('rtl') : setThemeDir('ltr')
    }
  }, [mounted])

  // Update themeDir when it changes
  // This ensures that the document's direction is set correctly
  // when the themeDir state changes.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('dir', themeDir)
    }
  }, [themeDir])

  // toggleDarkMode
  // This function toggles the dark mode state and updates the localStorage
  // and the HTML class accordingly
  const toggleDarkMode = useCallback((): void => {
    if (!mounted) return
    
    if (localStorage.getItem('theme') === 'light-mode') {
      setIsDarkMode(true)
      const root = document.querySelector('html')
      if (root && !root.classList.contains('dark')) {
        root.classList.add('dark')
      }
      localStorage.setItem('theme', 'dark-mode')
    } else {
      setIsDarkMode(false)
      const root = document.querySelector('html')
      if (root) {
        root.classList.remove('dark')
      }
      localStorage.setItem('theme', 'light-mode')
    }
  }, [mounted])

  // No renderizar nada hasta que esté montado para evitar hidratación
  if (!mounted) {
    return null
  }

  //
  return (
    <ThemeContext.Provider
        value={{
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
