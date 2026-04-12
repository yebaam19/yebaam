'use client'

/**
 * BusinessHours Component
 *
 * Muestra los horarios de atención del negocio.
 */

import { ClockIcon } from '@heroicons/react/24/outline'

interface BusinessHoursData {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

interface BusinessHoursProps {
  /** Horarios del negocio en formato JSON */
  hours?: BusinessHoursData | null
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
 * Obtiene el día actual de la semana
 */
function getCurrentDay(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

/**
 * Componente para mostrar horarios de atención
 */
export function BusinessHours({ hours }: BusinessHoursProps) {
  const currentDay = getCurrentDay()

  if (!hours || Object.keys(hours).length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
            <ClockIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Horarios</h2>
        </div>

        <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-center dark:bg-neutral-700/50">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Este negocio aún no ha agregado sus horarios de atención.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
          <ClockIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Horarios</h2>
      </div>

      {/* Schedule */}
      <div className="mt-4 space-y-2">
        {DAYS_OF_WEEK.map(({ key, label }) => {
          const dayHours = hours[key as keyof BusinessHoursData]
          const isToday = key === currentDay
          const isClosed = !dayHours || dayHours.toLowerCase() === 'cerrado'

          return (
            <div
              key={key}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                isToday ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-neutral-50 dark:bg-neutral-700/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    isToday ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {label}
                </span>
                {isToday && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    Hoy
                  </span>
                )}
              </div>
              <span
                className={`text-sm ${
                  isClosed
                    ? 'text-red-600 dark:text-red-400'
                    : isToday
                      ? 'font-medium text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {dayHours || 'Cerrado'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
