'use client'

import { useEffect, useState } from 'react'
import { GetCity, GetState } from 'react-country-state-city'

// Interfaces para la librería
interface Country {
  id: number
  name: string
  phonecode?: string
  sortname?: string
  iso2?: string
}

interface State {
  id: number
  name: string
  state_code?: string
}

interface City {
  id: number
  name: string
}

// ID de Colombia en la librería react-country-state-city
const COLOMBIA_ID = 48
const COLOMBIA_NAME = 'Colombia'

interface LocationFieldsProps {
  country: string
  state: string
  city: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function LocationFields({ country, state, city, onChange }: LocationFieldsProps) {
  const [statesList, setStatesList] = useState<State[]>([])
  const [citiesList, setCitiesList] = useState<City[]>([])
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null)
  const [isLoadingStates, setIsLoadingStates] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)

  // Cargar departamentos de Colombia al montar
  useEffect(() => {
    const fetchStates = async () => {
      setIsLoadingStates(true)
      try {
        const states = await GetState(COLOMBIA_ID)
        // Ordenar alfabéticamente
        const sortedStates = (states as State[]).sort((a, b) => a.name.localeCompare(b.name, 'es'))
        setStatesList(sortedStates)
      } catch (error) {
        console.error('Error fetching states:', error)
      } finally {
        setIsLoadingStates(false)
      }
    }

    fetchStates()

    // Establecer país como Colombia automáticamente
    if (!country) {
      const syntheticEvent = {
        target: { name: 'country', value: COLOMBIA_NAME },
      } as React.ChangeEvent<HTMLSelectElement>
      onChange(syntheticEvent)
    }
  }, [])

  // Cargar ciudades cuando cambia el departamento
  useEffect(() => {
    const fetchCities = async () => {
      if (state && selectedStateId) {
        setIsLoadingCities(true)
        try {
          const cities = await GetCity(COLOMBIA_ID, selectedStateId)
          // Ordenar alfabéticamente
          const sortedCities = (cities as City[]).sort((a, b) => a.name.localeCompare(b.name, 'es'))
          setCitiesList(sortedCities)
        } catch (error) {
          console.error('Error fetching cities:', error)
          setCitiesList([])
        } finally {
          setIsLoadingCities(false)
        }
      } else {
        setCitiesList([])
      }
    }

    fetchCities()
  }, [state, selectedStateId])

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateName = e.target.value
    const selectedState = statesList.find((s) => s.name === stateName)

    setSelectedStateId(selectedState?.id || null)

    // Reset city cuando cambia el estado
    const resetCityEvent = {
      target: { name: 'city', value: '' },
    } as React.ChangeEvent<HTMLSelectElement>
    onChange(resetCityEvent)

    // Actualizar estado
    onChange(e)
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-gray-600">País de residencia</label>
      <div className="space-y-3">
        {/* País - Solo Colombia por ahora */}
        <select
          name="country"
          value={country || COLOMBIA_NAME}
          onChange={onChange}
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        >
          <option value={COLOMBIA_NAME}>Colombia</option>
        </select>

        <label className="mb-2 block text-xs font-medium text-gray-600">Departamento de residencia</label>
        <select
          name="state"
          value={state}
          onChange={handleStateChange}
          required
          disabled={isLoadingStates}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          <option value="">{isLoadingStates ? 'Cargando departamentos...' : 'Selecciona un departamento'}</option>
          {statesList.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        <label className="mb-2 block text-xs font-medium text-gray-600">Ciudad de residencia</label>
        <select
          name="city"
          value={city}
          onChange={onChange}
          required
          disabled={!state || isLoadingCities}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          <option value="">
            {isLoadingCities
              ? 'Cargando ciudades...'
              : state
                ? 'Selecciona una ciudad'
                : 'Primero selecciona un departamento'}
          </option>
          {citiesList.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
