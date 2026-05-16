'use client'

/**
 * CreateBusinessStep1 - Información básica
 *
 * Paso 1: Nombre y descripción del negocio
 */

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { BusinessFormData } from '../CreateBusinessModal'

interface CreateBusinessStep1Props {
  data: BusinessFormData
  onChange: (data: Partial<BusinessFormData>) => void
  onNext: () => void
}

export function CreateBusinessStep1({ data, onChange, onNext }: CreateBusinessStep1Props) {
  const t = useTranslations('businesses.create.step1')
  const [name, setName] = useState(data.name || '')
  const [description, setDescription] = useState(data.description || '')

  const canProceed = name.trim().length >= 3

  const handleNext = () => {
    if (!canProceed) return
    onChange({
      name: name.trim(),
      description: description.trim(),
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-neutral-900 dark:text-white">{t('heading')}</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('subtitle')}</p>
      </div>

      {/* Nombre del negocio */}
      <div>
        <label
          htmlFor="business-name"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {t('nameLabel')} <span className="text-red-500">{t('requiredMark')}</span>
        </label>
        <input
          id="business-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          maxLength={100}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{t('nameCounter', { count: name.length })}</p>
      </div>

      {/* Descripción */}
      <div>
        <label
          htmlFor="business-description"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {t('descriptionLabel')} <span className="text-xs text-neutral-400">{t('descriptionOptional')}</span>
        </label>
        <textarea
          id="business-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          rows={4}
          maxLength={500}
          className="block w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{t('descriptionCounter', { count: description.length })}</p>
      </div>

      {/* Botón siguiente */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('next')}
        </button>
      </div>
    </div>
  )
}
