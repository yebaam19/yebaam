'use client'

import Avatar from '@/ui/Avatar'
import { Dialog, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { HeartIcon as HeartSolidIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment, useState } from 'react'
import { CityMedia } from '../interfaces/city.interfaces'
import { cityService } from '../services/city.service'

interface CityMediaDialogProps {
  cityName: string
  media: CityMedia[]
  open: boolean
  onClose: () => void
  initialIndex?: number
}

/**
 * Dialog para ver fotos/videos de la ciudad en detalle
 * Incluye navegación entre medios y sistema de likes
 */
export function CityMediaDialog({ cityName, media, open, onClose, initialIndex = 0 }: CityMediaDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [likedMedia, setLikedMedia] = useState<Record<string, boolean>>(() => {
    // Inicializar estado de likes desde los datos
    const initial: Record<string, boolean> = {}
    media.forEach((m) => {
      initial[m.id] = m.isLikedByUser
    })
    return initial
  })
  const [likesCount, setLikesCount] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    media.forEach((m) => {
      initial[m.id] = m.likesCount
    })
    return initial
  })

  const currentMedia = media[currentIndex]

  const goToPrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, media.length - 1))
  }

  const handleLike = async () => {
    if (!currentMedia) return

    const isCurrentlyLiked = likedMedia[currentMedia.id]

    // Optimistic update
    setLikedMedia((prev) => ({
      ...prev,
      [currentMedia.id]: !isCurrentlyLiked,
    }))
    setLikesCount((prev) => ({
      ...prev,
      [currentMedia.id]: isCurrentlyLiked ? prev[currentMedia.id] - 1 : prev[currentMedia.id] + 1,
    }))

    // API call (mock)
    if (isCurrentlyLiked) {
      await cityService.unlikeCityMedia(currentMedia.id)
    } else {
      await cityService.likeCityMedia(currentMedia.id)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrev()
    } else if (e.key === 'ArrowRight') {
      goToNext()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!currentMedia) return null

  const isLiked = likedMedia[currentMedia.id]
  const currentLikesCount = likesCount[currentMedia.id]
  const formattedDate = new Date(currentMedia.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} onKeyDown={handleKeyDown}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/90" />
        </TransitionChild>

        {/* Dialog content */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="relative h-screen w-full max-w-6xl">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-20 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                  aria-label="Cerrar"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                {/* Title (visually hidden for accessibility) */}
                <DialogTitle className="sr-only">
                  Foto de {currentMedia.user.firstName} en {cityName}
                </DialogTitle>

                {/* Media viewer */}
                <div className="flex h-full w-full items-center justify-center p-4 sm:p-8">
                  <div className="relative h-full w-full">
                    {currentMedia.type === 'IMAGE' ? (
                      <Image
                        src={currentMedia.url}
                        alt={`Foto de ${cityName}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1536px) 100vw, 1536px"
                        priority
                      />
                    ) : (
                      <video src={currentMedia.url} className="h-full w-full object-contain" controls autoPlay />
                    )}
                  </div>
                </div>

                {/* Navigation buttons */}
                {media.length > 1 && (
                  <>
                    {currentIndex > 0 && (
                      <button
                        onClick={goToPrev}
                        className="absolute top-1/2 left-4 z-20 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
                        aria-label="Anterior"
                      >
                        <ChevronLeftIcon className="h-6 w-6" />
                      </button>
                    )}
                    {currentIndex < media.length - 1 && (
                      <button
                        onClick={goToNext}
                        className="absolute top-1/2 right-4 z-20 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
                        aria-label="Siguiente"
                      >
                        <ChevronRightIcon className="h-6 w-6" />
                      </button>
                    )}
                  </>
                )}

                {/* Info panel */}
                <div className="absolute bottom-0 left-0 z-10 w-full bg-linear-to-t from-black/80 via-black/40 to-transparent p-4 sm:bottom-4 sm:left-4 sm:w-auto sm:max-w-sm sm:rounded-xl sm:bg-black/70 sm:backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Link href={`/${currentMedia.user.username}`} className="shrink-0">
                      <Avatar
                        src={currentMedia.user.avatarUrl}
                        initials={currentMedia.user.firstName.charAt(0)}
                        alt={currentMedia.user.username}
                        className="h-10 w-10"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/${currentMedia.user.username}`}
                        className="block truncate font-medium text-white hover:underline"
                      >
                        {currentMedia.user.firstName} {currentMedia.user.lastName}
                      </Link>
                      <p className="text-sm text-white/70">@{currentMedia.user.username}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3">
                    <span className="text-sm text-white/70">{formattedDate}</span>
                    <button
                      onClick={handleLike}
                      className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-white transition-colors hover:bg-white/30"
                    >
                      {isLiked ? (
                        <HeartSolidIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5" />
                      )}
                      <span className="text-sm font-medium">{currentLikesCount}</span>
                    </button>
                  </div>
                </div>

                {/* Media counter */}
                {media.length > 1 && (
                  <div className="absolute top-4 left-4 z-10 rounded-full bg-black/50 px-3 py-1.5 text-sm font-medium text-white">
                    {currentIndex + 1} / {media.length}
                  </div>
                )}
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
