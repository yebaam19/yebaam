'use client'

import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ProfessionalServiceBasic, ProfessionalServiceCategory } from '../../interfaces/directory.interfaces'
import { ServiceCard } from './ServiceCard'

interface ServiceListProps {
  services: ProfessionalServiceBasic[]
  categories: ProfessionalServiceCategory[]
}

// Alfabeto para el filtro
const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('')

/**
 * Componente de filtro alfabético
 */
function AlphabetFilter({
  selectedLetter,
  onLetterSelect,
  availableLetters,
}: {
  selectedLetter: string | null
  onLetterSelect: (letter: string | null) => void
  availableLetters: Set<string>
}) {
  return (
    <div className="flex flex-wrap justify-center gap-1 rounded-xl bg-neutral-100 p-2 dark:bg-neutral-800">
      <button
        onClick={() => onLetterSelect(null)}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          selectedLetter === null
            ? 'bg-amber-500 text-white'
            : 'text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700'
        }`}
      >
        Todos
      </button>
      {ALPHABET.map((letter) => {
        const isAvailable = availableLetters.has(letter)
        return (
          <button
            key={letter}
            onClick={() => isAvailable && onLetterSelect(letter)}
            disabled={!isAvailable}
            className={`min-w-8 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
              selectedLetter === letter
                ? 'bg-amber-500 text-white'
                : isAvailable
                  ? 'text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700'
                  : 'cursor-not-allowed text-neutral-300 dark:text-neutral-600'
            }`}
          >
            {letter}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Grupo de categoría con scroll horizontal
 */
function CategoryGroup({
  category,
  services,
}: {
  category: ProfessionalServiceCategory
  services: ProfessionalServiceBasic[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }, [])

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320 // Ancho aproximado de una tarjeta + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }, [])

  if (services.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Header de categoría */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {category.name}
          <span className="ml-2 text-sm font-normal text-neutral-500">({services.length})</span>
        </h3>

        {/* Controles de scroll */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            aria-label="Scroll izquierda"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            aria-label="Scroll derecha"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Lista horizontal */}
      <div ref={scrollRef} onScroll={checkScroll} className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {services.map((service) => (
          <div key={service.id} className="w-72 shrink-0 sm:w-80">
            <ServiceCard service={service} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Lista de servicios profesionales con búsqueda, filtro alfabético y agrupación por categoría
 */
export function ServiceList({ services, categories }: ServiceListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)

  // Letras disponibles basadas en los servicios
  const availableLetters = useMemo(() => {
    const letters = new Set<string>()
    services.forEach((service) => {
      const firstLetter = service.name.charAt(0).toUpperCase()
      if (ALPHABET.includes(firstLetter)) {
        letters.add(firstLetter)
      }
    })
    return letters
  }, [services])

  // Servicios filtrados
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Filtro por búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        if (!service.name.toLowerCase().includes(search) && !service.category.name.toLowerCase().includes(search)) {
          return false
        }
      }

      // Filtro por letra
      if (selectedLetter) {
        if (service.name.charAt(0).toUpperCase() !== selectedLetter) {
          return false
        }
      }

      return true
    })
  }, [services, searchTerm, selectedLetter])

  // Agrupar por categoría
  const groupedServices = useMemo(() => {
    const groups: Record<string, ProfessionalServiceBasic[]> = {}

    filteredServices.forEach((service) => {
      const categoryId = service.category.id
      if (!groups[categoryId]) {
        groups[categoryId] = []
      }
      groups[categoryId].push(service)
    })

    return groups
  }, [filteredServices])

  return (
    <div className="space-y-8">
      {/* Barra de búsqueda */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar servicios profesionales..."
          className="w-full rounded-xl border border-neutral-200 bg-white py-3 pr-4 pl-12 text-neutral-900 placeholder-neutral-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
      </div>

      {/* Filtro alfabético */}
      <AlphabetFilter
        selectedLetter={selectedLetter}
        onLetterSelect={setSelectedLetter}
        availableLetters={availableLetters}
      />

      {/* Resultados */}
      {filteredServices.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-neutral-500 dark:text-neutral-400">
            No se encontraron servicios profesionales con los criterios de búsqueda
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {categories
            .filter((category) => groupedServices[category.id]?.length > 0)
            .map((category) => (
              <CategoryGroup key={category.id} category={category} services={groupedServices[category.id]} />
            ))}
        </div>
      )}
    </div>
  )
}
