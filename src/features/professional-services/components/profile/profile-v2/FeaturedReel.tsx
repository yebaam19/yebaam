'use client'

import { PlayIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useState } from 'react'
import { ProfessionalServiceMedia, ServiceMediaType } from '../../../interfaces/professional-service.interfaces'
import { ServiceMediaDialog } from '../ServiceMediaDialog'

interface FeaturedReelProps {
  media: ProfessionalServiceMedia[]
  serviceName: string
}

/**
 * "Foto o Reel": el primer elemento de media mostrado en grande. Al hacer clic
 * abre el lightbox (`ServiceMediaDialog`) con toda la galería.
 */
export function FeaturedReel({ media, serviceName }: FeaturedReelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const featured = media[0]

  if (!featured) {
    return (
      <div className="flex aspect-16/9 w-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
        Sin contenido destacado todavía.
      </div>
    )
  }

  const isVideo = featured.type === ServiceMediaType.VIDEO

  return (
    <>
      <button
        type="button"
        onClick={() => setSelectedIndex(0)}
        className="group relative block aspect-16/9 w-full overflow-hidden rounded-2xl bg-neutral-200 shadow-sm dark:bg-neutral-700"
      >
        <Image
          src={featured.url}
          alt={featured.caption || serviceName}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
          unoptimized
        />

        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90">
              <PlayIcon className="h-7 w-7 text-neutral-900" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
      </button>

      <ServiceMediaDialog
        media={media}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onNavigate={setSelectedIndex}
        serviceName={serviceName}
      />
    </>
  )
}
