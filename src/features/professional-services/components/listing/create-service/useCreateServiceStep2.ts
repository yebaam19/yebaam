'use client'

import { useState } from 'react'
import type { CreateProfessionalServiceDTO } from '../../../interfaces/professional-service.interfaces'
import { useCategories } from '../../../hooks/useCategories'
import { useStates, useAllCities } from '../../../hooks/useLocations'

/**
 * State + derived data for `CreateServiceStep2` (category + location): loads the
 * category/state/city catalogues, tracks the selections, filters cities by
 * state, derives the active subcategories, and commits the step on Next.
 */
export function useCreateServiceStep2(
  data: Partial<CreateProfessionalServiceDTO>,
  onUpdate: (data: Partial<CreateProfessionalServiceDTO>) => void,
  onNext: () => void,
) {
  const { data: categoriesRaw, isLoading: isLoadingCategories } = useCategories()
  const categories = categoriesRaw ?? []
  const { data: statesRaw, isLoading: isLoadingStates } = useStates()
  const states = statesRaw ?? []
  const { data: citiesRaw, isLoading: isLoadingCities } = useAllCities()
  const cities = citiesRaw ?? []

  const [categoryId, setCategoryId] = useState(data.categoryId || '')
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>(data.subcategoryIds ?? [])
  const [selectedStateId, setSelectedStateId] = useState('')
  const [cityId, setCityId] = useState(data.cityId || '')
  const [tagsText, setTagsText] = useState((data.tags ?? []).join(', '))

  // Filtrar ciudades por estado seleccionado
  const filteredCities = selectedStateId
    ? cities.filter((city) => city.stateId === selectedStateId)
    : cities

  // Subcategorías de la categoría seleccionada (taxonomía del PDF)
  const selectedCategory = categories.find((c) => c.id === categoryId)
  const subcategories = selectedCategory?.subcategories ?? []

  const isLoading = isLoadingCategories || isLoadingStates || isLoadingCities

  // Si la categoría tiene subcategorías, exige al menos una
  // (PDF: "el usuario coloca categoría y después la o las subcategoría(s)").
  const canProceed = Boolean(
    categoryId && cityId && (subcategories.length === 0 || subcategoryIds.length > 0),
  )

  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId)
    setSubcategoryIds([]) // Reset subcategorías al cambiar de categoría
  }

  const toggleSubcategory = (id: string) => {
    setSubcategoryIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId)
    setCityId('') // Reset ciudad cuando cambia el estado
  }

  const handleNext = () => {
    if (!canProceed) return

    onUpdate({
      categoryId,
      subcategoryIds,
      cityId,
      tags: tagsText
        .split(',')
        .map((t) => t.trim().replace(/^#+/, ''))
        .filter(Boolean),
    })
    onNext()
  }

  return {
    isLoading,
    categories,
    states,
    filteredCities,
    subcategories,
    categoryId,
    subcategoryIds,
    selectedStateId,
    cityId,
    tagsText,
    setCityId,
    setTagsText,
    canProceed,
    handleCategoryChange,
    toggleSubcategory,
    handleStateChange,
    handleNext,
  }
}
