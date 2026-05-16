/**
 * ServicesFilterBar Component
 *
 * Barra de filtros para búsqueda de servicios profesionales.
 * Incluye búsqueda, filtros por ubicación y categoría.
 */

'use client'

import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'
import Input from '@/ui/Input'

import {
  City,
  ProfessionalServiceCategory,
  ProfessionalServiceFilters,
  State,
} from '../../interfaces/professional-service.interfaces'

// ============================================================================
// TYPES
// ============================================================================

interface ServicesFilterBarProps {
  filters: ProfessionalServiceFilters
  onFiltersChange: (filters: ProfessionalServiceFilters) => void
  states: State[]
  cities: City[]
  categories: ProfessionalServiceCategory[]
  isLoading?: boolean
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ServicesFilterBar({
  filters,
  onFiltersChange,
  states,
  cities,
  categories,
  isLoading = false,
  className,
}: ServicesFilterBarProps) {
  const t = useTranslations('professional.services.filterBar')
  const [searchValue, setSearchValue] = useState(filters.search ?? '')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Ciudades filtradas por estado seleccionado
  const filteredCities = filters.stateId ? cities.filter((city) => city.stateId === filters.stateId) : cities

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue || undefined, page: 1 })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue])

  const handleStateChange = useCallback(
    (stateId: string) => {
      onFiltersChange({
        ...filters,
        stateId: stateId || undefined,
        cityId: undefined, // Reset city when state changes
        page: 1,
      })
    },
    [filters, onFiltersChange]
  )

  const handleCityChange = useCallback(
    (cityId: string) => {
      onFiltersChange({
        ...filters,
        cityId: cityId || undefined,
        page: 1,
      })
    },
    [filters, onFiltersChange]
  )

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      onFiltersChange({
        ...filters,
        categoryId: categoryId || undefined,
        page: 1,
      })
    },
    [filters, onFiltersChange]
  )

  const clearFilters = useCallback(() => {
    setSearchValue('')
    onFiltersChange({ page: 1, limit: filters.limit })
  }, [filters.limit, onFiltersChange])

  const hasActiveFilters = filters.search || filters.stateId || filters.cityId || filters.categoryId

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and mobile filter toggle */}
      <div className="flex gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pr-10 pl-10"
            disabled={isLoading}
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile filter toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-300 lg:hidden dark:border-neutral-700"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Desktop Filters */}
      <div className={cn('grid gap-3 lg:grid-cols-4', showMobileFilters ? 'grid-cols-1' : 'hidden lg:grid')}>
        {/* State/Department Filter */}
        <div>
          <label
            htmlFor="state-filter"
            className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {t('stateLabel')}
          </label>
          <select
            id="state-filter"
            value={filters.stateId ?? ''}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            disabled={isLoading}
          >
            <option value="">{t('stateAll')}</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div>
          <label
            htmlFor="city-filter"
            className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {t('cityLabel')}
          </label>
          <select
            id="city-filter"
            value={filters.cityId ?? ''}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            disabled={isLoading || (!filters.stateId && filteredCities.length === 0)}
          >
            <option value="">{t('cityAll')}</option>
            {filteredCities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label
            htmlFor="category-filter"
            className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {t('categoryLabel')}
          </label>
          <select
            id="category-filter"
            value={filters.categoryId ?? ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            disabled={isLoading}
          >
            <option value="">{t('categoryAll')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
              disabled={isLoading}
            >
              <XMarkIcon className="h-4 w-4" />
              {t('clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Active filters tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <FilterTag
              label={t('searchTag', { query: filters.search })}
              onRemove={() => {
                setSearchValue('')
                onFiltersChange({ ...filters, search: undefined, page: 1 })
              }}
            />
          )}
          {filters.stateId && (
            <FilterTag
              label={states.find((s) => s.id === filters.stateId)?.name ?? t('stateFallback')}
              onRemove={() => handleStateChange('')}
            />
          )}
          {filters.cityId && (
            <FilterTag
              label={cities.find((c) => c.id === filters.cityId)?.name ?? t('cityFallback')}
              onRemove={() => handleCityChange('')}
            />
          )}
          {filters.categoryId && (
            <FilterTag
              label={categories.find((c) => c.id === filters.categoryId)?.name ?? t('categoryFallback')}
              onRemove={() => handleCategoryChange('')}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FilterTagProps {
  label: string
  onRemove: () => void
}

function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
      {label}
      <button onClick={onRemove} className="ml-1 hover:text-primary-900 dark:hover:text-primary-100">
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  )
}
