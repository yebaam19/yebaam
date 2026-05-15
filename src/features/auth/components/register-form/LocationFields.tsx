'use client'

import { useEffect, useMemo } from 'react'
import coLocations from './data/co-locations.json'
import { COUNTRIES, COLOMBIA_NAME } from './data/countries'

const DEPARTMENTS = Object.keys(coLocations) as Array<keyof typeof coLocations>
const CITIES_BY_DEPARTMENT = coLocations as Record<string, readonly string[]>

interface LocationFieldsProps {
  country: string
  state: string
  city: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

function emit(
  onChange: LocationFieldsProps['onChange'],
  name: string,
  value: string,
) {
  onChange({
    target: { name, value },
  } as React.ChangeEvent<HTMLSelectElement>)
}

export function LocationFields({ country, state, city, onChange }: LocationFieldsProps) {
  const isColombia = country === COLOMBIA_NAME
  const citiesList = useMemo(
    () => (isColombia && state ? (CITIES_BY_DEPARTMENT[state] ?? []) : []),
    [isColombia, state],
  )

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e)
    emit(onChange, 'state', '')
    emit(onChange, 'city', '')
  }

  const handleStateSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    emit(onChange, 'city', '')
    onChange(e)
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-gray-600">País de residencia</label>
      <div className="space-y-3">
        <select
          name="country"
          value={country || COLOMBIA_NAME}
          onChange={handleCountryChange}
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {isColombia ? (
          <>
            <label className="mb-2 block text-xs font-medium text-gray-600">Departamento de residencia</label>
            <select
              name="state"
              value={state}
              onChange={handleStateSelectChange}
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
          </>
        ) : (
          <>
            <label className="mb-2 block text-xs font-medium text-gray-600">Región / Estado / Provincia</label>
            <input
              type="text"
              name="state"
              value={state}
              onChange={onChange}
              required
              placeholder="Región / Estado / Provincia"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
            />

            <label className="mb-2 block text-xs font-medium text-gray-600">Ciudad de residencia</label>
            <input
              type="text"
              name="city"
              value={city}
              onChange={onChange}
              required
              placeholder="Ciudad"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
            />
          </>
        )}
      </div>
    </div>
  )
}
