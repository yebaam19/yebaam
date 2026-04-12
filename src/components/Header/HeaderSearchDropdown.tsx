'use client'

import { SearchInput } from '@/features/search/components'
import { SearchHistory } from '@/features/search/components/SearchHistory'
import { SearchSuggestions } from '@/features/search/components/SearchSuggestions'
import type { SearchResultType } from '@/features/search/interfaces/search.interfaces'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * Dropdown de búsqueda para el header
 * Muestra historial y sugerencias cuando el input está enfocado
 */
export function HeaderSearchDropdown() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
          placeholder="Buscar en Yebaam..."
          className="w-full"
        />
      </div>

      {/* Dropdown con historial y sugerencias */}
      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[500px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
          {!query ? (
            // Sin query: mostrar historial y sugerencias
            <div className="divide-y divide-gray-200 dark:divide-neutral-700">
              <SearchHistory onSearchClick={handleSearch} />
              <SearchSuggestions onSuggestionClick={handleSearch} />
            </div>
          ) : (
            // Con query: mensaje de "presiona Enter"
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Presiona <kbd className="rounded bg-gray-100 px-2 py-1 dark:bg-neutral-700">Enter</kbd> para buscar "
              {query}"
            </div>
          )}
        </div>
      )}

      {/* Overlay backdrop (móvil) */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
