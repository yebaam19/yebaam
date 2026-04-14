/**
 * CreateServiceStep2 - Categoría y ubicación
 *
 * Paso 2: Selección de categoría, estado y ciudad
 */

'use client'

import { ChevronDownIcon } from '@/components/icons/heroicons-shim'
import { useState } from 'react'

import { CreateProfessionalServiceDTO } from '../../../interfaces/professional-service.interfaces'
import { useCategories } from '../../../hooks/useCategories'
import { useStates, useAllCities } from '../../../hooks/useLocations'

interface CreateServiceStep2Props {
  data: Partial<CreateProfessionalServiceDTO>
  onUpdate: (data: Partial<CreateProfessionalServiceDTO>) => void
  onNext: () => void
  onBack: () => void
}

export function CreateServiceStep2({ data, onUpdate, onNext, onBack }: CreateServiceStep2Props) {
  // Usar hooks reales en lugar de mock
  const { data: categoriesRaw, isLoading: isLoadingCategories } = useCategories()

  const categories = categoriesRaw ?? []
  const { data: statesRaw, isLoading: isLoadingStates } = useStates()

  const states = statesRaw ?? []
  const { data: citiesRaw, isLoading: isLoadingCities } = useAllCities()

  const cities = citiesRaw ?? []

  const [categoryId, setCategoryId] = useState(data.categoryId || '')
  const [selectedStateId, setSelectedStateId] = useState('')
  const [cityId, setCityId] = useState(data.cityId || '')

  // Filtrar ciudades por estado seleccionado
  const filteredCities = selectedStateId ? cities.filter((city) => city.stateId === selectedStateId) : cities

  const isLoading = isLoadingCategories || isLoadingStates || isLoadingCities

  const canProceed = categoryId && cityId

  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId)
    setCityId('') // Reset ciudad cuando cambia el estado
  }

  const handleNext = () => {
    if (!canProceed) return

    onUpdate({
      categoryId,
      cityId,
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-neutral-900 dark:text-white">Categoría y ubicación</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Esto ayudará a las personas a encontrar tu servicio
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : (
        <>
          {/* Categoría */}
          <div>
            <label
              htmlFor="service-category"
              className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Categoría <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="service-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="block w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-10 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        </div>
        {categoryId && (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {categories.find((c) => c.id === categoryId)?.description}
          </p>
        )}
      </div>

      {/* Estado/Departamento */}
      <div>
        <label
          htmlFor="service-state"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Departamento <span className="text-xs text-neutral-400">(para filtrar ciudades)</span>
        </label>
        <div className="relative">
          <select
            id="service-state"
            value={selectedStateId}
            onChange={(e) => handleStateChange(e.target.value)}
            className="block w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-10 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option value="">Todos los departamentos</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        </div>
      </div>

      {/* Ciudad */}
      <div>
        <label htmlFor="service-city" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Ciudad <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="service-city"
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="block w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-10 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option value="">Seleccionar ciudad...</option>
            {filteredCities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} {city.state && `(${city.state.name})`}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="rounded-lg border border-neutral-300 bg-white px-6 py-2.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
        >
          Atrás
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
        </>
      )}
    </div>
  )
}
