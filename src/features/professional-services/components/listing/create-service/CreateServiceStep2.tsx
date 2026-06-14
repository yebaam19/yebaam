/**
 * CreateServiceStep2 - Categoría y ubicación
 *
 * Paso 2: Selección de categoría, estado y ciudad
 */

'use client'

import { ChevronDownIcon } from '@/components/icons/heroicons-shim'

import type { CreateProfessionalServiceDTO } from '../../../interfaces/professional-service.interfaces'
import { useCreateServiceStep2 } from './useCreateServiceStep2'

interface CreateServiceStep2Props {
  data: Partial<CreateProfessionalServiceDTO>
  onUpdate: (data: Partial<CreateProfessionalServiceDTO>) => void
  onNext: () => void
  onBack: () => void
}

export function CreateServiceStep2({ data, onUpdate, onNext, onBack }: CreateServiceStep2Props) {
  const {
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
  } = useCreateServiceStep2(data, onUpdate, onNext)

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
                onChange={(e) => handleCategoryChange(e.target.value)}
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

      {/* Subcategorías (taxonomía del PDF) */}
      {categoryId && subcategories.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Subcategorías <span className="text-red-500">*</span>
            <span className="ml-1 text-xs font-normal text-neutral-400">(elige una o varias)</span>
          </label>
          <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            {subcategories.map((sub) => {
              const active = subcategoryIds.includes(sub.id)
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => toggleSubcategory(sub.id)}
                  aria-pressed={active}
                  className={
                    active
                      ? 'rounded-full border border-primary-500 bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'rounded-full border border-neutral-300 px-3 py-1 text-sm text-neutral-600 transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-neutral-600 dark:text-neutral-300'
                  }
                >
                  {sub.name}
                </button>
              )
            })}
          </div>
          {subcategoryIds.length > 0 && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {subcategoryIds.length} seleccionada{subcategoryIds.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

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

      {/* Hashtags — descubrimiento alterno en el directorio (PDF) */}
      <div>
        <label
          htmlFor="service-tags"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Hashtags <span className="text-xs text-neutral-400">(opcional, separa con comas)</span>
        </label>
        <input
          id="service-tags"
          type="text"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="contratos, derecho laboral, asesoría"
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Ayudan a que tu servicio aparezca en búsquedas alternas del directorio.
        </p>
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
