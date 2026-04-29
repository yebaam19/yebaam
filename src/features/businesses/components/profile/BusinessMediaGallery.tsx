'use client'

/**
 * BusinessMediaGallery Component
 *
 * Galería de imágenes y videos del negocio con lightbox.
 */

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { ChevronLeftIcon, ChevronRightIcon, PhotoIcon, PlayIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { Fragment, useState } from 'react'
import { BusinessMedia, BusinessMediaType } from '../../interfaces/business.interfaces'

interface BusinessMediaGalleryProps {
  /** Lista de medios del negocio */
  media: BusinessMedia[]
  /** Nombre del negocio para alt text */
  businessName: string
  /** Número máximo de items a mostrar inicialmente */
  initialDisplayCount?: number
}

/**
 * Galería de medios del negocio
 */
export function BusinessMediaGallery({ media, businessName, initialDisplayCount = 6 }: BusinessMediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  // Filtrar solo imágenes y videos
  const displayableMedia = media.filter((m) => m.type === BusinessMediaType.IMAGE || m.type === BusinessMediaType.VIDEO)

  const displayedMedia = showAll ? displayableMedia : displayableMedia.slice(0, initialDisplayCount)
  const hasMore = displayableMedia.length > initialDisplayCount

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : displayableMedia.length - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex < displayableMedia.length - 1 ? selectedIndex + 1 : 0)
    }
  }

  // Manejar teclas del teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') closeLightbox()
  }

  if (displayableMedia.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <PhotoIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Galería</h2>
        </div>

        <div className="mt-4 rounded-xl bg-neutral-50 p-8 text-center dark:bg-neutral-700/50">
          <PhotoIcon className="mx-auto h-12 w-12 text-neutral-400" />
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Este negocio aún no ha agregado fotos o videos.
          </p>
        </div>
      </div>
    )
  }

  const selectedMedia = selectedIndex !== null ? displayableMedia[selectedIndex] : null

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <PhotoIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Galería</h2>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">({displayableMedia.length})</span>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
        {displayedMedia.map((item, index) => (
          <button
            key={item.id}
            onClick={() => openLightbox(showAll ? index : index)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none dark:bg-neutral-700"
          >
            <Image
              src={item.type === BusinessMediaType.VIDEO ? item.thumbnailUrl || item.url : item.url}
              alt={item.alt || `${businessName} - Imagen ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Video indicator */}
            {item.type === BusinessMediaType.VIDEO && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-neutral-900 transition-transform group-hover:scale-110">
                  <PlayIcon className="h-6 w-6 translate-x-0.5" />
                </div>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
          </button>
        ))}
      </div>

      {/* Show More Button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full rounded-xl bg-neutral-100 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
        >
          Ver todas las fotos ({displayableMedia.length})
        </button>
      )}

      {/* Lightbox */}
      <Transition show={selectedIndex !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeLightbox}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/90" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto" onKeyDown={handleKeyDown}>
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="relative max-h-[90vh] w-full max-w-5xl">
                  {/* Close button */}
                  <button
                    onClick={closeLightbox}
                    className="absolute -top-12 right-0 p-2 text-white/70 transition-colors hover:text-white"
                  >
                    <XMarkIcon className="h-8 w-8" />
                  </button>

                  {/* Navigation */}
                  {displayableMedia.length > 1 && (
                    <>
                      <button
                        onClick={goToPrevious}
                        className="absolute top-1/2 left-0 z-10 -translate-x-full -translate-y-1/2 p-4 text-white/70 transition-colors hover:text-white sm:-translate-x-16"
                      >
                        <ChevronLeftIcon className="h-10 w-10" />
                      </button>
                      <button
                        onClick={goToNext}
                        className="absolute top-1/2 right-0 z-10 translate-x-full -translate-y-1/2 p-4 text-white/70 transition-colors hover:text-white sm:translate-x-16"
                      >
                        <ChevronRightIcon className="h-10 w-10" />
                      </button>
                    </>
                  )}

                  {/* Media Content */}
                  {selectedMedia && (
                    <div className="aspect-video relative overflow-hidden rounded-xl bg-black">
                      {selectedMedia.type === BusinessMediaType.VIDEO ? (
                        <video
                          src={selectedMedia.url}
                          controls
                          autoPlay
                          className="h-full w-full object-contain"
                          poster={selectedMedia.thumbnailUrl || undefined}
                        />
                      ) : (
                        <Image
                          src={selectedMedia.url}
                          alt={selectedMedia.alt || `${businessName}`}
                          fill
                          sizes="(max-width: 1024px) 100vw, 80vw"
                          className="object-contain"
                        />
                      )}
                    </div>
                  )}

                  {/* Counter */}
                  <div className="mt-4 text-center text-sm text-white/70">
                    {selectedIndex !== null && `${selectedIndex + 1} / ${displayableMedia.length}`}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}
