'use client'

import { HeartIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import Image from 'next/image'
import { useState } from 'react'
import { CityMedia, MediaType } from '../interfaces/city.interfaces'
import { CityMediaDialog } from './CityMediaDialog'
import { CityMediaUploader } from './CityMediaUploader'

interface CityMediaGalleryProps {
  media: CityMedia[]
  emptyMessage?: string
  cityName: string
  mediaType?: MediaType
}

/**
 * Galería de fotos/videos de la ciudad
 * Incluye uploader y dialog para ver en detalle
 */
export function CityMediaGallery({
  media,
  emptyMessage = 'No hay contenido disponible',
  cityName,
  mediaType = MediaType.IMAGE,
}: CityMediaGalleryProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleMediaClick = (index: number) => {
    setSelectedIndex(index)
    setDialogOpen(true)
  }

  const handleUploadComplete = () => {
    // En un caso real, aquí refrescaríamos los datos del servidor
    console.log('[CityMediaGallery] Upload completed, would refresh data')
  }

  // Extraer un cityId del primer media, o usar un placeholder
  const cityId = media[0]?.cityId || 'mock-city-id'

  return (
    <div className="space-y-4">
      {/* Uploader */}
      <CityMediaUploader
        cityId={cityId}
        cityName={cityName}
        mediaType={mediaType}
        onUploadComplete={handleUploadComplete}
      />

      {/* Gallery */}
      {media.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item, index) => (
            <MediaCard key={item.id} media={item} onClick={() => handleMediaClick(index)} />
          ))}
        </div>
      )}

      {/* Dialog */}
      {media.length > 0 && (
        <CityMediaDialog
          cityName={cityName}
          media={media}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          initialIndex={selectedIndex}
        />
      )}
    </div>
  )
}

/**
 * Estado vacío de la galería
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center dark:bg-neutral-800">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
        <PhotoIcon className="h-8 w-8 text-neutral-400" />
      </div>
      <p className="text-neutral-500 dark:text-neutral-400">{message}</p>
    </div>
  )
}

/**
 * Tarjeta individual de media
 */
function MediaCard({ media, onClick }: { media: CityMedia; onClick: () => void }) {
  const [isLiked, setIsLiked] = useState(media.isLikedByUser)
  const [likesCount, setLikesCount] = useState(media.likesCount)

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que se abra el dialog
    if (isLiked) {
      setLikesCount((prev) => prev - 1)
    } else {
      setLikesCount((prev) => prev + 1)
    }
    setIsLiked(!isLiked)
  }

  return (
    <div
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-700"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick()
        }
      }}
      aria-label={`Ver foto de ${media.user.firstName}`}
    >
      {media.type === MediaType.IMAGE ? (
        <Image
          src={media.url}
          alt={`Foto de ${media.user.firstName}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <video src={media.url} className="h-full w-full object-cover" muted />
      )}

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {/* Info on hover */}
      <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {media.user.avatarUrl ? (
              <Image
                src={media.user.avatarUrl}
                alt={media.user.username}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white">
                {media.user.firstName.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-white">{media.user.firstName}</span>
          </div>

          <button
            onClick={handleLike}
            className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            aria-label={isLiked ? 'Quitar me gusta' : 'Dar me gusta'}
          >
            {isLiked ? <HeartSolidIcon className="h-4 w-4 text-red-500" /> : <HeartIcon className="h-4 w-4" />}
            <span className="text-xs font-medium">{likesCount}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
