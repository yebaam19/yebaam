'use client'

import { SearchInput } from '@/features/search/components'
import { SearchHistory } from '@/features/search/components/SearchHistory'
import { SearchSuggestions } from '@/features/search/components/SearchSuggestions'
import { useDebouncedValue } from '@/features/search/hooks/useDebouncedValue'
import type { SearchResultType } from '@/features/search/interfaces/search.interfaces'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

interface UserResult {
  id: string
  username: string
  fullName: string
  avatarUrl: string | null
}

/**
 * Dropdown de búsqueda para el header
 * Muestra historial y sugerencias cuando el input está enfocado
 */
export function HeaderSearchDropdown() {
  const router = useRouter()
  const t = useTranslations('header')
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<UserResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebouncedValue(query, 200)

  // Live user search as the user types.
  useEffect(() => {
    const q = debouncedQuery.trim()
    if (q.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }
    const controller = new AbortController()
    setIsLoading(true)
    fetch(`/api/search/users?q=${encodeURIComponent(q)}&limit=8`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((payload: { results?: UserResult[] }) => {
        if (controller.signal.aborted) return
        setResults(payload.results ?? [])
      })
      .catch(() => {
        if (!controller.signal.aborted) setResults([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [debouncedQuery])

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string, type?: SearchResultType) => {
    if (!searchQuery.trim()) return

    // Construir URL con parámetros
    const params = new URLSearchParams()
    params.set('q', searchQuery.trim())
    if (type && type !== 'all') {
      params.set('type', type)
    }

    // Navegar a página de búsqueda
    router.push(`/search?${params.toString()}`)

    // Cerrar dropdown y limpiar
    setIsOpen(false)
    setQuery('')
  }

  const handleFocus = () => {
    setIsOpen(true)
  }

  const handleClear = () => {
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative w-full max-w-sm lg:max-w-md">
      {/* Search Input */}
      <div onFocus={handleFocus}>
        <SearchInput
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
          onClear={handleClear}
          placeholder={t('searchPlaceholder')}
          className="w-full"
        />
      </div>

      {/* Dropdown con historial, sugerencias y resultados en vivo */}
      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[500px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
          {!query ? (
            <div className="divide-y divide-gray-200 dark:divide-neutral-700">
              <SearchHistory onSearchClick={handleSearch} />
              <SearchSuggestions onSuggestionClick={handleSearch} />
            </div>
          ) : query.trim().length < 2 ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {t('typeAtLeast2Chars')}
            </div>
          ) : (
            <div>
              {/* Lista de usuarios encontrados */}
              {results.length > 0 && (
                <ul className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {results.map((user) => (
                    <li key={user.id}>
                      <Link
                        href={`/${user.username || user.id}`}
                        onClick={() => {
                          setIsOpen(false)
                          setQuery('')
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
                      >
                        <div className="h-9 w-9 shrink-0 rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                          {user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" decoding="async" loading="lazy" />
                          ) : (
                            (user.fullName || user.username || '?').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.fullName || user.username}
                          </p>
                          {user.username && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              @{user.username}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {/* Estado vacío / cargando */}
              {isLoading && results.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t('searching')}
                </div>
              )}
              {!isLoading && results.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t('noUsersFound', { query })}
                </div>
              )}

              {/* Footer: ver todos los resultados */}
              <button
                onClick={() => handleSearch(query)}
                className="w-full border-t border-gray-200 dark:border-neutral-700 px-4 py-2.5 text-center text-sm font-medium text-primary-600 hover:bg-gray-50 dark:text-primary-400 dark:hover:bg-neutral-700/50"
              >
                {t('viewAllResultsFor', { query })}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay backdrop (móvil) */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
