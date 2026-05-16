'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Country from 'country-state-city/lib/country'

const COUNTRIES = Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name, 'es'))

type StateRow = { name: string; isoCode: string }
type CityRow = { name: string }

let stateModule: typeof import('country-state-city/lib/state') | null = null
let cityModule: typeof import('country-state-city/lib/city') | null = null

async function loadStateModule() {
  if (!stateModule) stateModule = await import('country-state-city/lib/state')
  return stateModule.default
}

async function loadCityModule() {
  if (!cityModule) cityModule = await import('country-state-city/lib/city')
  return cityModule.default
}

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
  const t = useTranslations('auth')
  const [states, setStates] = useState<StateRow[]>([])
  const [cities, setCities] = useState<CityRow[]>([])
  const [isLoadingStates, setIsLoadingStates] = useState(false)
  const [isLoadingCities, setIsLoadingCities] = useState(false)

  useEffect(() => {
    if (!country) emit(onChange, 'country', 'CO')
  }, [country, onChange])

  useEffect(() => {
    if (!country) {
      setStates([])
      return
    }
    let cancelled = false
    setIsLoadingStates(true)
    loadStateModule()
      .then((State) => {
        if (cancelled) return
        const rows = State.getStatesOfCountry(country) as StateRow[]
        rows.sort((a, b) => a.name.localeCompare(b.name, 'es'))
        setStates(rows)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStates(false)
      })
    return () => {
      cancelled = true
    }
  }, [country])

  useEffect(() => {
    if (!country || !state) {
      setCities([])
      return
    }
    let cancelled = false
    setIsLoadingCities(true)
    loadCityModule()
      .then((City) => {
        if (cancelled) return
        const rows = City.getCitiesOfState(country, state) as CityRow[]
        rows.sort((a, b) => a.name.localeCompare(b.name, 'es'))
        setCities(rows)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCities(false)
      })
    return () => {
      cancelled = true
    }
  }, [country, state])

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e)
    emit(onChange, 'state', '')
    emit(onChange, 'city', '')
  }

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    emit(onChange, 'city', '')
    onChange(e)
  }

  const noStatesAvailable = !isLoadingStates && country && states.length === 0

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-gray-600">{t('signup.countryLabel')}</label>
      <div className="space-y-3">
        <select
          name="country"
          value={country || 'CO'}
          onChange={handleCountryChange}
          required
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
        >
          {COUNTRIES.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>

        <label className="mb-2 block text-xs font-medium text-gray-600">
          {noStatesAvailable ? t('signup.stateLabelRegion') : t('signup.stateLabelDepartment')}
        </label>
        {noStatesAvailable ? (
          <input
            type="text"
            name="state"
            value={state}
            onChange={onChange}
            required
            placeholder={t('signup.statePlaceholderInput')}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
          />
        ) : (
          <select
            name="state"
            value={state}
            onChange={handleStateChange}
            required
            disabled={isLoadingStates}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">
              {isLoadingStates ? t('signup.statePlaceholderLoading') : t('signup.statePlaceholderSelect')}
            </option>
            {states.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <label className="mb-2 block text-xs font-medium text-gray-600">{t('signup.cityLabel')}</label>
        {noStatesAvailable ? (
          <input
            type="text"
            name="city"
            value={city}
            onChange={onChange}
            required
            placeholder={t('signup.cityPlaceholderInput')}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all focus:border-transparent focus:ring-2 focus:ring-green-600 focus:outline-none"
          />
        ) : (
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
                ? t('signup.cityPlaceholderLoading')
                : !state
                  ? t('signup.cityPlaceholderSelectState')
                  : cities.length === 0
                    ? t('signup.cityPlaceholderNoCities')
                    : t('signup.cityPlaceholderSelect')}
            </option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
