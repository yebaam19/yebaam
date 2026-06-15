import { useTranslations } from 'next-intl'
import { FC, useState } from 'react'
import type { CreateClubDto } from '../../types/club.types'

interface CreateClubStep2Props {
  data: Partial<CreateClubDto>
  onUpdate: (data: Partial<CreateClubDto>) => void
  onNext: () => void
  onBack: () => void
}

export const CreateClubStep2: FC<CreateClubStep2Props> = ({ data, onUpdate, onNext, onBack }) => {
  const t = useTranslations('clubes.create.step2')
  const [privacy, setPrivacy] = useState(data.privacy || 'PUBLIC')
  const [subcategory, setSubcategory] = useState(data.subcategory || '')
  const [location, setLocation] = useState(data.location || '')
  const [website, setWebsite] = useState(data.website || '')

  const handleNext = () => {
    onUpdate({
      privacy,
      subcategory: subcategory.trim() || undefined,
      location: location.trim() || undefined,
      website: website.trim() || undefined,
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">{t('heading')}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Privacidad */}
      <div>
        <label htmlFor="club-privacy" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('privacyLabel')}
        </label>
        <select
          id="club-privacy"
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value as 'PUBLIC' | 'PRIVATE')}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        >
          <option value="PUBLIC">{t('privacyPublic')}</option>
          <option value="PRIVATE">{t('privacyPrivate')}</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {privacy === 'PUBLIC' ? t('privacyPublicHint') : t('privacyPrivateHint')}
        </p>
      </div>

      {/* Subcategoría */}
      <div>
        <label htmlFor="club-subcategory" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('subcategoryLabel')} <span className="text-xs text-gray-400">{t('optional')}</span>
        </label>
        <input
          id="club-subcategory"
          type="text"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          placeholder={t('subcategoryPlaceholder')}
          maxLength={50}
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 dark:placeholder-gray-300 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Ubicación */}
      <div>
        <label htmlFor="club-location" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('locationLabel')} <span className="text-xs text-gray-400">{t('optional')}</span>
        </label>
        <input
          id="club-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('locationPlaceholder')}
          maxLength={100}
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 dark:placeholder-gray-300 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Website */}
      <div>
        <label htmlFor="club-website" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('websiteLabel')} <span className="text-xs text-gray-400">{t('optional')}</span>
        </label>
        <input
          id="club-website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder={t('websitePlaceholder')}
          maxLength={500}
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 dark:placeholder-gray-300 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="rounded-lg border border-neutral-300 px-6 py-2.5 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:outline-none dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          {t('back')}
        </button>
        <button
          onClick={handleNext}
          className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
        >
          {t('next')}
        </button>
      </div>
    </div>
  )
}
