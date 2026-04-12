/**
 * CreateServiceStep3 - Precios y disponibilidad
 *
 * Paso 3: Configuración de tarifas y disponibilidad
 */

'use client'

import { useState } from 'react'

import { CreateProfessionalServiceDTO } from '../../../interfaces/professional-service.interfaces'

interface CreateServiceStep3Props {
  data: Partial<CreateProfessionalServiceDTO>
  onUpdate: (data: Partial<CreateProfessionalServiceDTO>) => void
  onNext: () => void
  onBack: () => void
}

const CURRENCIES = [
  { value: 'COP', label: 'Peso Colombiano (COP)' },
  { value: 'USD', label: 'Dólar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
]

const WORK_TYPES = [
  { value: 'on-site', label: 'Presencial' },
  { value: 'remote', label: 'Remoto' },
  { value: 'hybrid', label: 'Híbrido' },
]

export function CreateServiceStep3({ data, onUpdate, onNext, onBack }: CreateServiceStep3Props) {
  const [hourlyRate, setHourlyRate] = useState(data.hourlyRate?.toString() || '')
  const [dailyRate, setDailyRate] = useState(data.dailyRate?.toString() || '')
  const [projectRate, setProjectRate] = useState(data.projectRate?.toString() || '')
  const [currency, setCurrency] = useState(data.currency || 'COP')
  const [availableForHire, setAvailableForHire] = useState(data.availableForHire ?? true)
  const [workType, setWorkType] = useState<string[]>(data.workType || [])

  const toggleWorkType = (type: string) => {
    setWorkType((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const handleNext = () => {
    onUpdate({
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      dailyRate: dailyRate ? parseFloat(dailyRate) : undefined,
      projectRate: projectRate ? parseFloat(projectRate) : undefined,
      currency,
      availableForHire,
      workType: workType.length > 0 ? workType : undefined,
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-neutral-900 dark:text-white">Precios y disponibilidad</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Configura tus tarifas y modalidad de trabajo</p>
      </div>

      {/* Moneda */}
      <div>
        <label
          htmlFor="service-currency"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Moneda
        </label>
        <select
          id="service-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        >
          {CURRENCIES.map((curr) => (
            <option key={curr.value} value={curr.value}>
              {curr.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tarifas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="hourly-rate"
            className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Tarifa por hora
          </label>
          <input
            id="hourly-rate"
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="150000"
            min="0"
            className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="daily-rate" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Tarifa por día
          </label>
          <input
            id="daily-rate"
            type="number"
            value={dailyRate}
            onChange={(e) => setDailyRate(e.target.value)}
            placeholder="1000000"
            min="0"
            className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="project-rate"
            className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Tarifa por proyecto
          </label>
          <input
            id="project-rate"
            type="number"
            value={projectRate}
            onChange={(e) => setProjectRate(e.target.value)}
            placeholder="5000000"
            min="0"
            className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
      </div>

      {/* Modalidad de trabajo */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Modalidad de trabajo
        </label>
        <div className="flex flex-wrap gap-3">
          {WORK_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => toggleWorkType(type.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                workType.includes(type.value)
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Disponibilidad */}
      <div className="flex items-center gap-3">
        <input
          id="available-for-hire"
          type="checkbox"
          checked={availableForHire}
          onChange={(e) => setAvailableForHire(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="available-for-hire" className="text-sm text-neutral-700 dark:text-neutral-300">
          Disponible para contratar
        </label>
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
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
