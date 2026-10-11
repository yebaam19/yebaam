'use client'

/**
 * UserMedia Component
 *
 * Muestra fotos y videos del usuario
 */

import { ArrowPathIcon, PlusIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useUserPhotos } from '../../hooks/useProfile'
import { useAuth } from '@/features/auth/context/auth-context'
import UploadPhotoDialog from '../dialogs/UploadPhotoDialog'
import CreateAlbumDialog from '../dialogs/CreateAlbumDialog'
import { useProfileMediaStore } from '../../store/profile-media.store'

interface UserMediaProps {
  userId: string
}

export function UserPhotos({ userId }: UserMediaProps) {
  const t = useTranslations('profile.media')
  const { photos: profilePhotos, isLoading: isLoadingProfile, fetchUserPhotos } = useUserPhotos()
  const { user } = useAuth()
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false)
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const { fetchMyAlbums, albums, fetchMyPhotos, photos: myPhotos, isLoadingPhotos } = useProfileMediaStore()
  
  const isOwnProfile = user?.id === userId
  
  // Usar las fotos del media store si es perfil propio, sino usar las del profile store
  const allPhotos = isOwnProfile ? myPhotos : profilePhotos
  const isLoading = isOwnProfile ? isLoadingPhotos : isLoadingProfile
  
  // Filtrar fotos por álbum si hay uno seleccionado
  const photos = selectedAlbumId 
    ? allPhotos.filter(photo => photo.albumId === selectedAlbumId)
    : allPhotos
  
  // Obtener álbum seleccionado
  const selectedAlbum = selectedAlbumId 
    ? albums.find(album => album.id === selectedAlbumId)
    : null

  useEffect(() => {
    if (isOwnProfile) {
      // Si es mi perfil, cargar desde el media store
      fetchMyPhotos()
    } else {
      // Si es otro perfil, cargar desde el profile store
      if (!profilePhotos && !isLoadingProfile) {
        fetchUserPhotos(userId)
      }
    }
  }, [userId, isOwnProfile, fetchMyPhotos, fetchUserPhotos, profilePhotos, isLoadingProfile])
  
  useEffect(() => {
    if (isOwnProfile && albums.length === 0) {
      fetchMyAlbums()
    }
  }, [isOwnProfile, albums.length, fetchMyAlbums])

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <ArrowPathIcon className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">
          {isOwnProfile ? t('photosEmptyOwn') : t('photosEmptyOther')}
        </p>
        {isOwnProfile && (
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setCreateAlbumOpen(true)}
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              {t('createAlbum')}
            </button>
            <button
              onClick={() => setUploadPhotoOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              {t('uploadPhotos')}
            </button>
          </div>
        )}
        
        {/* Modals */}
        {isOwnProfile && (
          <>
            <UploadPhotoDialog open={uploadPhotoOpen} onOpenChange={setUploadPhotoOpen} />
            <CreateAlbumDialog open={createAlbumOpen} onOpenChange={setCreateAlbumOpen} />
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb / Navigation */}
      {selectedAlbum && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => setSelectedAlbumId(null)}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            {t('backToAlbums')}
          </button>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-900 dark:text-white font-medium">{selectedAlbum.name}</span>
        </div>
      )}

      {/* Header con botones de acción */}
      {isOwnProfile && !selectedAlbumId && (
        <div className="flex justify-end gap-3 pb-2">
          <button
            onClick={() => setCreateAlbumOpen(true)}
            className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm"
          >
            {t('createAlbum')}
          </button>
          <button
            onClick={() => setUploadPhotoOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            {t('uploadPhotos')}
          </button>
        </div>
      )}

      {/* Álbumes Section - Solo mostrar si no hay álbum seleccionado */}
      {isOwnProfile && albums.length > 0 && !selectedAlbumId && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t('albumsHeading', { count: albums.length })}
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {albums.map((album) => (
              <button
                key={album.id}
                onClick={() => setSelectedAlbumId(album.id)}
                className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 cursor-pointer hover:shadow-lg transition-all text-left"
              >
                {album.coverPhotoUrl ? (
                  <Image
                    src={album.coverPhotoUrl}
                    alt={album.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-12 h-12 text-neutral-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-neutral-500">{t('noPhotos')}</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-100 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <h4 className="font-semibold text-sm truncate">{album.name}</h4>
                  <p className="text-xs opacity-90">
                    {t('albumStats', { photos: album.photosCount, videos: album.videosCount })}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 my-6" />
        </div>
      )}

      {/* Fotos Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('sectionWithCount', { label: selectedAlbum ? t('photosInAlbum', { name: selectedAlbum.name }) : t('allPhotos'), count: photos.length })}
        </h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id || index}
              className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800"
            >
              {photo.url && <Image src={photo.url} alt={`Photo ${index + 1}`} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover object-center" unoptimized />}
            </div>
          ))}
        </div>
      </div>
      
      {/* Modals */}
      {isOwnProfile && (
        <>
          <UploadPhotoDialog open={uploadPhotoOpen} onOpenChange={setUploadPhotoOpen} />
          <CreateAlbumDialog open={createAlbumOpen} onOpenChange={setCreateAlbumOpen} />
        </>
      )}
    </div>
  )
}

