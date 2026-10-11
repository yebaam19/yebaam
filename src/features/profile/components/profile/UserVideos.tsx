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
import { useUserVideos } from '../../hooks/useProfile'
import { useAuth } from '@/features/auth/context/auth-context'
import UploadVideoDialog from '../dialogs/UploadVideoDialog'
import { useProfileMediaStore } from '../../store/profile-media.store'

interface UserMediaProps {
  userId: string
}

export function UserVideos({ userId }: UserMediaProps) {
  const t = useTranslations('profile.media')
  const { videos: profileVideos, isLoading: isLoadingProfile, fetchUserVideos } = useUserVideos()
  const { user } = useAuth()
  const [uploadVideoOpen, setUploadVideoOpen] = useState(false)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const { fetchMyAlbums, albums, fetchMyVideos, videos: myVideos, isLoadingVideos } = useProfileMediaStore()
  
  const isOwnProfile = user?.id === userId
  
  // Usar los videos del media store si es perfil propio, sino usar los del profile store
  const allVideos = isOwnProfile ? myVideos : profileVideos
  const isLoading = isOwnProfile ? isLoadingVideos : isLoadingProfile
  
  // Filtrar videos por álbum si hay uno seleccionado
  const videos = selectedAlbumId 
    ? allVideos.filter(video => video.albumId === selectedAlbumId)
    : allVideos
  
  // Obtener álbum seleccionado
  const selectedAlbum = selectedAlbumId 
    ? albums.find(album => album.id === selectedAlbumId)
    : null

  useEffect(() => {
    if (isOwnProfile) {
      // Si es mi perfil, cargar desde el media store
      fetchMyVideos()
    } else {
      // Si es otro perfil, cargar desde el profile store
      if (!profileVideos && !isLoadingProfile) {
        fetchUserVideos(userId)
      }
    }
  }, [userId, isOwnProfile, fetchMyVideos, fetchUserVideos, profileVideos, isLoadingProfile])
  
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

  if (!videos || videos.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground mb-4">
          {isOwnProfile ? t('videosEmptyOwn') : t('videosEmptyOther')}
        </p>
        {isOwnProfile && (
          <button
            onClick={() => setUploadVideoOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            {t('uploadVideo')}
          </button>
        )}
        
        {/* Modal */}
        {isOwnProfile && (
          <UploadVideoDialog open={uploadVideoOpen} onOpenChange={setUploadVideoOpen} />
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

      {/* Header con botón de acción */}
      {isOwnProfile && !selectedAlbumId && (
        <div className="flex justify-end pb-2">
          <button
            onClick={() => setUploadVideoOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            {t('uploadVideo')}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-neutral-500">{t('noVideos')}</p>
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

      {/* Videos Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {t('sectionWithCount', { label: selectedAlbum ? t('videosInAlbum', { name: selectedAlbum.name }) : t('allVideos'), count: videos.length })}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {videos.map((video, index) => {
            const isCloudflareStream =
              typeof video.url === 'string' && video.url.includes('iframe.videodelivery.net')
            return (
              <div
                key={video.id || index}
                className="aspect-video relative overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800"
              >
                {video.url ? (
                  isCloudflareStream ? (
                    <iframe
                      src={
                        video.thumbnailUrl
                          ? `${video.url}?poster=${encodeURIComponent(video.thumbnailUrl)}`
                          : video.url
                      }
                      className="w-full h-full"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen
                      title={video.caption || `Video ${index + 1}`}
                    />
                  ) : (
                    <video
                      src={video.url}
                      controls
                      className="w-full h-full object-cover"
                      poster={video.thumbnailUrl}
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-muted-foreground">{t('videoFallback')}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Modal */}
      {isOwnProfile && (
        <UploadVideoDialog open={uploadVideoOpen} onOpenChange={setUploadVideoOpen} />
      )}
    </div>
  )
}
