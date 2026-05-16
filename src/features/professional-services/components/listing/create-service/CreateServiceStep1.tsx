/**
 * CreateServiceStep1 - Información básica
 *
 * Paso 1: Nombre y descripción del servicio
 */

'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { CreateProfessionalServiceDTO } from '../../../interfaces/professional-service.interfaces'

interface CreateServiceStep1Props {
  data: Partial<CreateProfessionalServiceDTO>
  onUpdate: (data: Partial<CreateProfessionalServiceDTO>) => void
  onNext: () => void
}

// Generar slug desde nombre
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo alfanuméricos
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
}

export function CreateServiceStep1({ data, onUpdate, onNext }: CreateServiceStep1Props) {
  const t = useTranslations('professional.services.createStep1')
  const [name, setName] = useState(data.name || '')
  const [description, setDescription] = useState(data.description || '')
  const [address, setAddress] = useState(data.address || '')

  const canProceed = name.trim().length >= 3

  const handleNext = () => {
    if (!canProceed) return

    onUpdate({
      name: name.trim(),
      description: description.trim(),
      address: address.trim(),
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-neutral-900 dark:text-white">{t('heading')}</h4>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Nombre del servicio */}
      <div>
        <label htmlFor="service-name" className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('nameLabel')} <span className="text-red-500">{t('requiredMark')}</span>
        </label>
        <input
          id="service-name"
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
          htmlFor="service-description"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {t('descriptionLabel')} <span className="text-xs text-neutral-400">{t('descriptionOptional')}</span>
        </label>
        <textarea
          id="service-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          rows={4}
          maxLength={1000}
          className="block w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{t('descriptionCounter', { count: description.length })}</p>
      </div>

      {/* Dirección */}
      <div>
        <label
          htmlFor="service-address"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {t('addressLabel')} <span className="text-xs text-neutral-400">{t('addressOptional')}</span>
        </label>
        <input
          id="service-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t('addressPlaceholder')}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
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
