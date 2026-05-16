import { useTranslations } from 'next-intl'
import { FC, useState } from 'react'
import type { CreateClubDto, ClubCategory } from '../../types/club.types'

interface CreateClubStep1Props {
  data: Partial<CreateClubDto>
  onUpdate: (data: Partial<CreateClubDto>) => void
  onNext: () => void
}

export const CreateClubStep1: FC<CreateClubStep1Props> = ({ data, onUpdate, onNext }) => {
  const t = useTranslations('clubes.create.step1')
  const [name, setName] = useState(data.name || '')
  const [description, setDescription] = useState(data.description || '')
  const [category, setCategory] = useState<ClubCategory | ''>(data.category ?? '')

  const handleNext = () => {
    if (!name.trim() || !description.trim() || !category) {
      return
    }

    onUpdate({
      name: name.trim(),
      description: description.trim(),
      category: category || undefined,
    })
    onNext()
  }

  const canProceed = name.trim() && description.trim() && category

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">{t('heading')}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Nombre del club */}
      <div>
        <label htmlFor="club-name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('nameLabel')} <span className="text-red-500">{t('requiredMark')}</span>
        </label>
        <input
          id="club-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          maxLength={100}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('nameCounter', { count: name.length })}</p>
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="club-description" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('descriptionLabel')} <span className="text-red-500">{t('requiredMark')}</span>
        </label>
        <textarea
          id="club-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          rows={4}
          maxLength={500}
          className="block w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('descriptionCounter', { count: description.length })}</p>
      </div>

      {/* Categoría */}
      <div>
        <label htmlFor="club-category" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('categoryLabel')} <span className="text-red-500">{t('requiredMark')}</span>
        </label>
        <select
          id="club-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ClubCategory | '')}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        >
          <option value="">{t('categoryPlaceholder')}</option>
          <option value="DEPORTES">{t('categories.DEPORTES')}</option>
          <option value="TECNOLOGIA">{t('categories.TECNOLOGIA')}</option>
          <option value="ARTE">{t('categories.ARTE')}</option>
          <option value="MUSICA">{t('categories.MUSICA')}</option>
          <option value="LECTURA">{t('categories.LECTURA')}</option>
          <option value="COCINA">{t('categories.COCINA')}</option>
          <option value="VIAJES">{t('categories.VIAJES')}</option>
          <option value="FOTOGRAFIA">{t('categories.FOTOGRAFIA')}</option>
          <option value="NEGOCIOS">{t('categories.NEGOCIOS')}</option>
          <option value="EDUCACION">{t('categories.EDUCACION')}</option>
          <option value="SALUD">{t('categories.SALUD')}</option>
          <option value="GAMING">{t('categories.GAMING')}</option>
          <option value="CINE">{t('categories.CINE')}</option>
          <option value="OTRO">{t('categories.OTRO')}</option>
        </select>
      </div>

      {/* Navigation Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('next')}
        </button>
      </div>
    </div>
  )
}
