'use client'

import { PlayIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useState } from 'react'
import { ProfessionalServiceMedia, ServiceMediaType } from '../../interfaces/professional-service.interfaces'
import { ServiceMediaDialog } from './ServiceMediaDialog'

interface ServiceMediaGalleryProps {
  media: ProfessionalServiceMedia[]
  serviceName: string
}

/**
 * Galería de media del servicio profesional
 */
export function ServiceMediaGallery({ media, serviceName }: ServiceMediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (media.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Galería</h2>
        <p className="text-neutral-500 dark:text-neutral-400">Este servicio aún no tiene fotos o videos.</p>
      </div>
    )
  }

  // Mostrar máximo 6 items en la galería principal
  const displayMedia = media.slice(0, 6)
  const remainingCount = media.length - 6

  return (
    <>
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Galería
          <span className="ml-2 text-sm font-normal text-neutral-500">
            ({media.length} {media.length === 1 ? 'archivo' : 'archivos'})
          </span>
        </h2>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {displayMedia.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(index)}
              className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-700"
            >
              <Image
                src={item.url}
                alt={item.caption || `${serviceName} - ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 33vw"
                unoptimized
              />

              {/* Overlay para videos */}
              {item.type === ServiceMediaType.VIDEO && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90">
                    <PlayIcon className="h-6 w-6 text-neutral-900" />
                  </div>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

              {/* Mostrar "ver más" en el último item si hay más */}
              {index === 5 && remainingCount > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="text-2xl font-bold text-white">+{remainingCount}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Dialog para ver media */}
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
