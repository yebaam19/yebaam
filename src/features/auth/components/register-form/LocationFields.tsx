'use client'

import { useEffect, useMemo } from 'react'
import coLocations from './data/co-locations.json'

const COLOMBIA_NAME = 'Colombia'
const DEPARTMENTS = Object.keys(coLocations) as Array<keyof typeof coLocations>
const CITIES_BY_DEPARTMENT = coLocations as Record<string, readonly string[]>

interface LocationFieldsProps {
  country: string
  state: string
  city: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function LocationFields({ country, state, city, onChange }: LocationFieldsProps) {
  const citiesList = useMemo(() => (state ? (CITIES_BY_DEPARTMENT[state] ?? []) : []), [state])

  useEffect(() => {
    if (!country) {
      onChange({
        target: { name: 'country', value: COLOMBIA_NAME },
      } as React.ChangeEvent<HTMLSelectElement>)
    }
  }, [country, onChange])

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      target: { name: 'city', value: '' },
    } as React.ChangeEvent<HTMLSelectElement>)
    onChange(e)
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-gray-600">País de residencia</label>
      <div className="space-y-3">
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
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        >
          <option value="">Selecciona un departamento</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <label className="mb-2 block text-xs font-medium text-gray-600">Ciudad de residencia</label>
        <select
          name="city"
          value={city}
          onChange={onChange}
          required
          disabled={!state}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          <option value="">
            {state ? 'Selecciona una ciudad' : 'Primero selecciona un departamento'}
          </option>
          {citiesList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
