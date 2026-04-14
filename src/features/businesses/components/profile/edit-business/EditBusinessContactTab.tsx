'use client'

/**
 * EditBusinessContactTab Component
 *
 * Tab para editar información de contacto y horarios del negocio.
 */

import { useCitiesByState, useStates } from '@/features/businesses/hooks'
import { ClockIcon, EnvelopeIcon, GlobeAltIcon, MapPinIcon, PhoneIcon } from '@/components/icons/heroicons-shim'
import { useState } from 'react'

type BusinessHours = Record<string, string>

interface EditBusinessContactTabProps {
  address: string
  email: string
  phone: string
  website: string
  cityId: string
  hours: BusinessHours
  onAddressChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onWebsiteChange: (value: string) => void
  onCityChange: (value: string) => void
  onHoursChange: (value: BusinessHours) => void
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const

/**
 * Tab de edición de contacto
 */
export function EditBusinessContactTab({
  address,
  email,
  phone,
  website,
  cityId,
  hours,
  onAddressChange,
  onEmailChange,
  onPhoneChange,
  onWebsiteChange,
  onCityChange,
  onHoursChange,
}: EditBusinessContactTabProps) {
  const [selectedStateId, setSelectedStateId] = useState('')

  // Fetch data from API
  const { data: statesRaw, isLoading: loadingStates } = useStates()

  const states = statesRaw ?? []
  const { data: citiesRaw, isLoading: loadingCities } = useCitiesByState(selectedStateId || undefined)

  const cities = citiesRaw ?? []

  // Actualizar horario de un día específico
  const updateDayHours = (day: keyof BusinessHours, value: string) => {
    onHoursChange({
      ...hours,
      [day]: value,
    })
  }

  // Aplicar horarios de lunes a viernes
  const applyWeekdayHours = () => {
    if (hours.monday) {
      onHoursChange({
        ...hours,
        tuesday: hours.monday,
        wednesday: hours.monday,
        thursday: hours.monday,
        friday: hours.monday,
      })
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Location Section */}
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
        <h3 className="mb-4 flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
          <MapPinIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          Ubicación
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* State */}
          <div>
            <label
              htmlFor="business-state"
              className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Estado
            </label>
            <select
              id="business-state"
              value={selectedStateId}
              onChange={(e) => {
                setSelectedStateId(e.target.value)
                // Al cambiar estado, limpiar ciudad
                onCityChange('')
              }}
              disabled={loadingStates}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
            >
              <option value="">{loadingStates ? 'Cargando estados...' : 'Seleccionar estado'}</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label
              htmlFor="business-city"
              className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Ciudad <span className="text-red-500">*</span>
            </label>
            <select
              id="business-city"
              value={cityId}
              onChange={(e) => onCityChange(e.target.value)}
              disabled={!selectedStateId || loadingCities}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
            >
              <option value="">{loadingCities ? 'Cargando ciudades...' : 'Seleccionar ciudad'}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Address */}
        <div className="mt-4">
          <label
            htmlFor="business-address"
            className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Dirección completa
          </label>
          <input
            id="business-address"
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Calle, número, colonia, código postal..."
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* Contact Section */}
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
        <h3 className="mb-4 flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
          <PhoneIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
          Información de contacto
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Email */}
          <div>
            <label
              htmlFor="business-email"
              className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              <EnvelopeIcon className="mr-1 inline h-4 w-4" />
              Correo electrónico
            </label>
            <input
              id="business-email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="contacto@negocio.com"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="business-phone"
              className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              <PhoneIcon className="mr-1 inline h-4 w-4" />
              Teléfono
            </label>
            <input
              id="business-phone"
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
          </div>

          {/* Website */}
          <div className="sm:col-span-2">
            <label
              htmlFor="business-website"
              className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              <GlobeAltIcon className="mr-1 inline h-4 w-4" />
              Sitio web
            </label>
            <input
              id="business-website"
              type="url"
              value={website}
              onChange={(e) => onWebsiteChange(e.target.value)}
              placeholder="https://www.minegocio.com"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />
          </div>
        </div>
      </div>

      {/* Business Hours Section */}
      <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
            <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Horarios de atención
          </h3>
          <button
            onClick={applyWeekdayHours}
            disabled={!hours.monday}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:cursor-not-allowed disabled:text-neutral-400 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Aplicar Lunes a Viernes
          </button>
        </div>

        <div className="space-y-3">
          {DAYS_OF_WEEK.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
              <input
                type="text"
                value={hours[key as keyof BusinessHours] || ''}
                onChange={(e) => updateDayHours(key as keyof BusinessHours, e.target.value)}
                placeholder="9:00 AM - 6:00 PM"
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              />
              <button
                onClick={() => updateDayHours(key as keyof BusinessHours, 'Cerrado')}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-700"
              >
                Cerrado
              </button>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          Puedes escribir el horario en cualquier formato. Ejemplo: "9:00 AM - 6:00 PM" o "9:00 - 18:00"
        </p>
      </div>
    </div>
  )
}
