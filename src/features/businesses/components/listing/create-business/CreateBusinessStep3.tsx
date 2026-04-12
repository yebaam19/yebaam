'use client'

/**
 * CreateBusinessStep3 - Información de contacto
 *
 * Paso 3: Email, teléfono y sitio web
 */

import { useState } from 'react'
import type { BusinessFormData } from '../CreateBusinessModal'

interface CreateBusinessStep3Props {
  data: BusinessFormData
  onChange: (data: Partial<BusinessFormData>) => void
  onNext: () => void
  onBack: () => void
}

export function CreateBusinessStep3({ data, onChange, onNext, onBack }: CreateBusinessStep3Props) {
  const [email, setEmail] = useState(data.email || '')
  const [phone, setPhone] = useState(data.phone || '')
  const [website, setWebsite] = useState(data.website || '')

  const handleNext = () => {
    onChange({
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-neutral-900 dark:text-white">Información de contacto</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          ¿Cómo pueden contactarte tus clientes? (Opcional)
        </p>
      </div>

      {/* Contacto */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="business-email"
            className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Correo electrónico
          </label>
          <input
            id="business-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contacto@minegocio.com"
            className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="business-phone"
            className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Teléfono
          </label>
          <input
            id="business-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+57 300 123 4567"
            className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
          />
        </div>
      </div>

      {/* Website */}
      <div>
        <label
          htmlFor="business-website"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Sitio web
        </label>
        <input
          id="business-website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://www.minegocio.com"
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
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
