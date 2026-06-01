'use client'

import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useCallback, useEffect } from 'react'
import { ProfessionalServiceMedia, ServiceMediaType } from '../../interfaces/professional-service.interfaces'

interface ServiceMediaDialogProps {
  media: ProfessionalServiceMedia[]
  selectedIndex: number | null
  onClose: () => void
  serviceName: string
  /** Cambia el índice mostrado (anterior/siguiente). Sin esto, las flechas no navegan. */
  onNavigate?: (index: number) => void
}

/**
 * Dialog para visualizar media del servicio en tamaño completo
 */
export function ServiceMediaDialog({ media, selectedIndex, onClose, serviceName, onNavigate }: ServiceMediaDialogProps) {
  const isOpen = selectedIndex !== null
  const currentMedia = selectedIndex !== null ? media[selectedIndex] : null

  // Navegación
  const goToPrevious = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      onNavigate?.(selectedIndex - 1)
    }
  }, [selectedIndex, onNavigate])

  const goToNext = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < media.length - 1) {
      onNavigate?.(selectedIndex + 1)
    }
  }, [selectedIndex, media.length, onNavigate])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, goToPrevious, goToNext])

  if (!isOpen || !currentMedia) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="text-white">
            <h3 className="text-lg font-semibold">{serviceName}</h3>
            <p className="text-sm text-white/70">
              {selectedIndex! + 1} de {media.length}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Media Container */}
        <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
          {/* Previous Button */}
          {selectedIndex! > 0 && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Anterior"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          )}

          {/* Media */}
          <div className="relative h-full w-full max-w-5xl">
            {currentMedia.type === ServiceMediaType.VIDEO ? (
              <video src={currentMedia.url} controls autoPlay className="h-full w-full object-contain" />
            ) : (
              <Image
                src={currentMedia.url}
                alt={currentMedia.caption || `${serviceName} - ${selectedIndex! + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            )}
          </div>

          {/* Next Button */}
          {selectedIndex! < media.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Siguiente"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Caption */}
        {currentMedia.caption && (
          <div className="p-4 text-center">
            <p className="text-white/90">{currentMedia.caption}</p>
          </div>
        )}
      </div>
    </div>
  )
}
