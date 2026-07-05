'use client'

import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'

import type {
  City,
  ProfessionalServiceCategory,
  ProfessionalServiceFilters,
  State,
} from '../../../interfaces/professional-service.interfaces'

interface ActiveFilterTagsProps {
  filters: ProfessionalServiceFilters
  states: State[]
  cities: City[]
  categories: ProfessionalServiceCategory[]
  onRemoveSearch: () => void
  onRemoveState: () => void
  onRemoveCity: () => void
  onRemoveCategory: () => void
}

/** Chips de filtros activos con su botón de remover. */
export function ActiveFilterTags({
  filters,
  states,
  cities,
  categories,
  onRemoveSearch,
  onRemoveState,
  onRemoveCity,
  onRemoveCategory,
}: ActiveFilterTagsProps) {
  const t = useTranslations('professional.services.filterBar')

  return (
    <div className="flex flex-wrap gap-2">
      {filters.search && <FilterTag label={t('searchTag', { query: filters.search })} onRemove={onRemoveSearch} />}
      {filters.stateId && (
        <FilterTag
          label={states.find((s) => s.id === filters.stateId)?.name ?? t('stateFallback')}
          onRemove={onRemoveState}
        />
      )}
      {filters.cityId && (
        <FilterTag
          label={cities.find((c) => c.id === filters.cityId)?.name ?? t('cityFallback')}
          onRemove={onRemoveCity}
        />
      )}
      {filters.categoryId && (
        <FilterTag
          label={categories.find((c) => c.id === filters.categoryId)?.name ?? t('categoryFallback')}
          onRemove={onRemoveCategory}
        />
      )}
    </div>
  )
}

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
