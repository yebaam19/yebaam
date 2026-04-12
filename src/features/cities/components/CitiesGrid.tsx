'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { CityBasic } from '../interfaces/city.interfaces'
import { CityCard } from './CityCard'

interface CitiesGridProps {
  cities: CityBasic[]
  citiesPerPage?: number
}

/**
 * Grid de ciudades con paginación
 */
export function CitiesGrid({ cities, citiesPerPage = 9 }: CitiesGridProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(cities.length / citiesPerPage)
  const indexOfLastCity = currentPage * citiesPerPage
  const indexOfFirstCity = indexOfLastCity - citiesPerPage
  const currentCities = cities.slice(indexOfFirstCity, indexOfLastCity)

  // Slots vacíos para mantener el grid uniforme
  const emptySlotsNeeded = citiesPerPage - currentCities.length
  const emptySlots = Array(Math.max(0, emptySlotsNeeded)).fill(null)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-900">
      <div className="mx-auto space-y-6">
        {/* Grid de ciudades */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" style={{ minHeight: '400px' }}>
          {currentCities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
          {emptySlots.map((_, index) => (
            <div key={`empty-${index}`} className="invisible">
              <div className="rounded-xl border bg-white p-5 dark:bg-neutral-800">
                <div className="mb-2 h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
