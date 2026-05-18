'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { CityBasic } from '../interfaces/city.interfaces'
import { CityCard } from './CityCard'

interface CitiesGridProps {
  cities: CityBasic[]
  citiesPerPage?: number
}

/**
 * Paginated 4-column city grid. The page list is rendered URL-stateless on
 * purpose — the URL already encodes filters via `<CitiesToolbar>`; pagination
 * is purely visual scrolling within the filtered set so we don't pollute the
 * URL with `?page=N`.
 */
export function CitiesGrid({ cities, citiesPerPage = 8 }: CitiesGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const t = useTranslations('cities.list')
  const tCard = useTranslations('cities.card')
  const tGrid = useTranslations('cities.grid')

  const totalPages = Math.ceil(cities.length / citiesPerPage)
  const indexOfLastCity = currentPage * citiesPerPage
  const indexOfFirstCity = indexOfLastCity - citiesPerPage
  const currentCities = cities.slice(indexOfFirstCity, indexOfLastCity)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (cities.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('empty')}</p>
      </section>
    )
  }

  return (
    <section aria-label="Cities">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {currentCities.map((city) => (
          <CityCard key={city.id} city={city} exploreLabel={tCard('explore')} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label={tGrid('previous')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            const isActive = currentPage === page
            return (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                aria-current={isActive ? 'page' : undefined}
                className={
                  'flex h-9 min-w-[2.25rem] items-center justify-center rounded-full px-3 text-sm font-medium transition-colors ' +
                  (isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800')
                }
              >
                {page}
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label={tGrid('next')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </nav>
      )}
    </section>
  )
}
