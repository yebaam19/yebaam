'use client'

/**
 * EditBusinessImagesTab Component
 *
 * Tab para editar imágenes (logo y cover) del negocio.
 */

import { PhotoIcon, TrashIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface EditBusinessImagesTabProps {
  logoUrl: string
  coverUrl: string
  businessName: string
  onLogoChange: (url: string) => void
  onCoverChange: (url: string) => void
}

/**
 * Tab de edición de imágenes
 */
export function EditBusinessImagesTab({
  logoUrl,
  coverUrl,
  businessName,
  onLogoChange,
  onCoverChange,
}: EditBusinessImagesTabProps) {
  const t = useTranslations('businesses.editImages')
  return (
    <div className="space-y-6 p-6">
      {/* Cover Image */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('coverLabel')}
        </label>
        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          {t('coverHint')}
        </p>

        <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700/50">
          {coverUrl ? (
            <div className="group relative">
              <div className="relative aspect-3/1 w-full">
                <Image src={coverUrl} alt={t('coverAlt')} fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => {
                    // TODO: Implementar cambio de imagen
                    console.log('Cambiar cover')
                  }}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
                >
                  {t('change')}
                </button>
                <button
                  onClick={() => onCoverChange('')}
                  className="rounded-lg bg-red-600 p-2 text-white transition-colors hover:bg-red-700"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                // TODO: Implementar upload de imagen
                const demoUrl = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop'
                onCoverChange(demoUrl)
              }}
              className="flex aspect-3/1 w-full flex-col items-center justify-center gap-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
            >
              <PhotoIcon className="h-12 w-12" />
              <span className="text-sm font-medium">{t('uploadCover')}</span>
            </button>
          )}
        </div>

        {/* Cover URL Input */}
        <div className="mt-3">
          <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">
            {t('orUrlDirectly')}
          </label>
          <input
            type="url"
            value={coverUrl}
            onChange={(e) => onCoverChange(e.target.value)}
            placeholder={t('coverUrlPlaceholder')}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* Logo Image */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t('logoLabel')}
        </label>
        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          {t('logoHint')}
        </p>

        <div className="flex items-start gap-6">
          {/* Preview */}
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700/50">
            {logoUrl ? (
              <div className="group relative h-full w-full">
                <Image src={logoUrl} alt={t('logoAlt')} fill sizes="112px" className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => onLogoChange('')}
                    className="rounded-lg bg-red-600 p-2 text-white transition-colors hover:bg-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  // TODO: Implementar upload de imagen
                  const demoUrl = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop'
                  onLogoChange(demoUrl)
                }}
                className="flex h-full w-full flex-col items-center justify-center gap-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
              >
                <PhotoIcon className="h-8 w-8" />
                <span className="text-xs font-medium">{t('uploadShort')}</span>
              </button>
            )}
          </div>

          {/* URL Input */}
          <div className="flex-1">
            <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">
              {t('orUrlDirectly')}
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => onLogoChange(e.target.value)}
              placeholder={t('logoUrlPlaceholder')}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            />

            {/* Preview Letter */}
            {!logoUrl && (
              <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  {businessName.charAt(0).toUpperCase()}
                </div>
                <span>{t('defaultInitialHint')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-xl bg-neutral-100 p-4 dark:bg-neutral-800">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('tipsTitle')}</h4>
        <ul className="mt-2 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
          <li>• {t('tips.quality')}</li>
          <li>• {t('tips.lessText')}</li>
          <li>• {t('tips.logoSquare')}</li>
          <li>• {t('tips.formats')}</li>
        </ul>
      </div>
    </div>
  )
}
