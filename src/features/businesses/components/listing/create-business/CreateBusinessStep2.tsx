'use client'
import { useBusinessCategories, useCitiesByState, useStates } from '@/features/businesses/hooks'
import { useState } from 'react'

import type { BusinessFormData } from '../CreateBusinessModal'

interface CreateBusinessStep2Props {
  data: BusinessFormData
  onChange: (data: Partial<BusinessFormData>) => void
  onNext: () => void
  onBack: () => void
}

export function CreateBusinessStep2({ data, onChange, onNext, onBack }: CreateBusinessStep2Props) {
  const [categoryId, setCategoryId] = useState(data.categoryId || '')
  const [stateId, setStateId] = useState(data.stateId || '')
  const [cityId, setCityId] = useState(data.cityId || '')
  const [address, setAddress] = useState(data.address || '')

  // Fetch data from API
  const { data: categoriesRaw, isLoading: loadingCategories } = useBusinessCategories()

  const categories = categoriesRaw ?? []
  const { data: statesRaw, isLoading: loadingStates } = useStates()

  const states = statesRaw ?? []
  const { data: citiesRaw, isLoading: loadingCities } = useCitiesByState(stateId || undefined)

  const cities = citiesRaw ?? []

  const canProceed = categoryId && cityId

  const handleStateChange = (newStateId: string) => {
    setStateId(newStateId)
    setCityId('')
  }

  const handleNext = () => {
    if (!canProceed) return
    onChange({
      categoryId,
      stateId,
      cityId,
      address: address.trim(),
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-neutral-900 dark:text-white">Categoría y ubicación</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">¿Qué tipo de negocio es y dónde está ubicado?</p>
      </div>

      {/* Categoría */}
      <div>
        <label
          htmlFor="business-category"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Categoría <span className="text-red-500">*</span>
        </label>
        <select
          id="business-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={loadingCategories}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        >
          <option value="">{loadingCategories ? 'Cargando categorías...' : 'Selecciona una categoría'}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Ubicación */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="business-state"
            className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Departamento <span className="text-red-500">*</span>
          </label>
          <select
            id="business-state"
            value={stateId}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={loadingStates}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option value="">{loadingStates ? 'Cargando departamentos...' : 'Selecciona un departamento'}</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="business-city"
            className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Ciudad <span className="text-red-500">*</span>
          </label>
          <select
            id="business-city"
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            disabled={!stateId || loadingCities}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          >
            <option value="">{loadingCities ? 'Cargando ciudades...' : 'Selecciona una ciudad'}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label
          htmlFor="business-address"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Dirección <span className="text-xs text-neutral-400">(opcional)</span>
        </label>
        <input
          id="business-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej: Calle 10 #45-20, Zona G"
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="rounded-lg border border-neutral-300 px-6 py-2.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
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
    </div>
  )
}
