'use client'

import { PhotoIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface MediaGridItemProps {
  type: 'image' | 'video'
  url: string
  caption?: string
  onRemove: () => void
  onCaptionChange: (caption: string) => void
}

/** Tarjeta de un medio staged del paso 5: preview + quitar + descripción. */
export function MediaGridItem({ type, url, caption, onRemove, onCaptionChange }: MediaGridItemProps) {
  const t = useTranslations('professional.services.createStep5')
  return (
    <div className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      {/* Media Preview */}
      <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-700">
        {type === 'image' ? (
          <Image
            src={url}
            alt={caption || t('imageAlt')}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <PhotoIcon className="h-12 w-12 text-neutral-400" />
            <span className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
              {t('videoLabel')}
            </span>
          </div>
        )}

        {/* Remove Button */}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-red-600"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Caption Input */}
      <div className="p-2">
        <input
          type="text"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder={t('captionPlaceholder')}
          className="w-full rounded border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
      </div>
    </div>
  )
}
