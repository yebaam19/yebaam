'use client'

import { PhotoIcon, PlusIcon, TagIcon, TrashIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { FC, useState } from 'react'
import { useBusinessPhotos, useDeleteBusinessPhoto } from '../../hooks/useBusinessPhotos'
import { BusinessPhoto } from '../../interfaces/business-photo.interface'
import { UploadBusinessPhotoModal } from './UploadBusinessPhotoModal'

interface BusinessDetailPhotosProps {
  businessId: string
  isOwner?: boolean
}

export const BusinessDetailPhotos: FC<BusinessDetailPhotosProps> = ({ businessId, isOwner = false }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<BusinessPhoto | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const { data: photos = [], isLoading } = useBusinessPhotos(businessId)
  const deletePhotoMutation = useDeleteBusinessPhoto(businessId)

  const handlePhotoClick = (photo: BusinessPhoto) => {
    setSelectedPhoto(photo)
  }

  const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (confirm('¿Estás seguro de eliminar esta foto?')) {
      await deletePhotoMutation.mutateAsync(photoId)
    }
  }

  const handleCloseViewer = () => {
    setSelectedPhoto(null)
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          {isOwner && <div className="h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    )
  }

  // Empty State
  if (photos.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fotos</h2>
          {isOwner && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5" />
              Subir foto
            </button>
          )}
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-16 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <PhotoIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {isOwner ? 'No has subido fotos aún' : 'No hay fotos'}
          </h3>
          <p className="mb-6 max-w-md text-center text-sm text-gray-600 dark:text-gray-400">
            {isOwner
              ? 'Comparte momentos especiales de tu negocio. Sube fotos de tus productos, instalaciones o equipo.'
              : 'Este negocio aún no ha compartido fotos.'}
          </p>
          {isOwner && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5" />
              Subir primera foto
            </button>
          )}
        </div>

        {/* Upload Modal */}
        <UploadBusinessPhotoModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          businessId={businessId}
        />
      </div>
    )
  }

  // Photos Grid
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fotos</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
            </p>
          </div>
          {isOwner && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5" />
              Subir foto
            </button>
          )}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => handlePhotoClick(photo)}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-all hover:ring-2 hover:ring-primary-500 dark:bg-gray-800"
            >
              {/* Photo */}
              <Image
                src={photo.url}
                alt={photo.caption || 'Foto del negocio'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {/* Caption */}
                {photo.caption && (
                  <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="line-clamp-2 text-sm text-white">{photo.caption}</p>
                  </div>
                )}

                {/* Delete button for owner */}
                {isOwner && (
                  <button
                    onClick={(e) => handleDeletePhoto(photo.id, e)}
                    className="absolute top-2 right-2 rounded-lg bg-red-600 p-2 text-white transition-colors hover:bg-red-700"
                    disabled={deletePhotoMutation.isPending}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}

                {/* Tags indicator */}
                {photo.tags && photo.tags.length > 0 && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                    <TagIcon className="h-3 w-3" />
                    {photo.tags.length}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadBusinessPhotoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        businessId={businessId}
      />

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={handleCloseViewer}
        >
          <button
            onClick={handleCloseViewer}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
          >
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full" style={{ maxHeight: '80vh' }}>
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Foto del negocio'}
                width={1200}
                height={800}
                className="h-auto max-h-[80vh] w-full rounded-lg object-contain"
              />
            </div>

            {/* Photo Info */}
            <div className="mt-4 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              {selectedPhoto.caption && <p className="mb-3 text-lg text-white">{selectedPhoto.caption}</p>}

              {/* Tags */}
              {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedPhoto.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary-600/80 px-3 py-1 text-sm text-white"
                    >
                      <TagIcon className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-white/70">
                <span>
                  Subida por {selectedPhoto.uploadedBy.firstName} {selectedPhoto.uploadedBy.lastName}
                </span>
                <span>•</span>
                <span>
                  {new Date(selectedPhoto.uploadedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
