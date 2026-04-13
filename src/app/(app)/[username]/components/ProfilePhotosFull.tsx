'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  PhotoIcon,
  PlusIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@/components/icons/heroicons-shim';
import UploadPhotoDialog from '@/features/profile/components/dialogs/UploadPhotoDialog';
import CreateAlbumDialog from '@/features/profile/components/dialogs/CreateAlbumDialog';
import { useProfileMediaStore } from '@/features/profile/store/profile-media.store';
import { useEffect } from 'react';

interface Photo {
  id: string;
  url: string;
  alt?: string;
  createdAt: string;
  likes?: number;
  comments?: number;
}

interface ProfilePhotosFullProps {
  username: string;
  photos: Photo[];
  totalPhotos: number;
  isOwnProfile: boolean;
}

export default function ProfilePhotosFull({
  username,
  photos,
  totalPhotos,
  isOwnProfile,
}: ProfilePhotosFullProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'albums' | 'tagged'>('all');
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  
  // Cargar álbumes si es el perfil propio
  const { fetchMyAlbums, albums } = useProfileMediaStore();
  
  useEffect(() => {
    if (isOwnProfile && albums.length === 0) {
      fetchMyAlbums();
    }
  }, [isOwnProfile, albums.length, fetchMyAlbums]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Fotos
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              {totalPhotos.toLocaleString()} fotos
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-neutral-700 shadow-sm'
                    : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <Squares2X2Icon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-700 shadow-sm'
                    : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <ListBulletIcon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              </button>
            </div>

            {isOwnProfile && (
              <>
                <button 
                  onClick={() => setCreateAlbumOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Crear álbum
                </button>
                <button 
                  onClick={() => setUploadPhotoOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Subir fotos
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Todas las fotos
          </button>
          <button
            onClick={() => setFilter('albums')}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              filter === 'albums'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Álbumes
          </button>
          <button
            onClick={() => setFilter('tagged')}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              filter === 'tagged'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Etiquetado
          </button>
        </div>
      </div>

      {/* Albums View */}
      {filter === 'albums' && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
            Mis Álbumes ({albums.length})
          </h3>
          {albums.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="group relative aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                >
                  {album.coverPhotoUrl ? (
                    <img
                      src={album.coverPhotoUrl}
                      alt={album.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="w-16 h-16 text-neutral-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-100 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h4 className="font-semibold text-base mb-1 truncate">{album.name}</h4>
                    <p className="text-xs opacity-90">
                      {album.photosCount} fotos · {album.videosCount} videos
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <PhotoIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                No tienes álbumes todavía
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => setCreateAlbumOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Crear primer álbum
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Photos Grid/List */}
      {filter !== 'albums' && photos.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <Link
                key={photo.id}
                href={`/${username}/photos/${photo.id}`}
                className="group relative aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-2xl overflow-hidden"
              >
                <img
                  src={photo.url}
                  alt={photo.alt || 'Photo'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                
                {/* Stats overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3 text-white text-sm">
                    {photo.likes !== undefined && (
                      <span>❤️ {photo.likes}</span>
                    )}
                    {photo.comments !== undefined && (
                      <span>💬 {photo.comments}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {photos.map((photo) => (
              <Link
                key={photo.id}
                href={`/${username}/photos/${photo.id}`}
                className="block bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                    <img
                      src={photo.url}
                      alt={photo.alt || 'Photo'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {photo.alt || 'Foto sin descripción'}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {new Date(photo.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                      {photo.likes !== undefined && (
                        <span>❤️ {photo.likes} Me gusta</span>
                      )}
                      {photo.comments !== undefined && (
                        <span>💬 {photo.comments} Comentarios</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : filter !== 'albums' ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-16 text-center shadow-sm">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-2xl" />
            <div className="relative w-24 h-24 bg-linear-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-full flex items-center justify-center">
              <PhotoIcon className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
            {isOwnProfile ? '¡Sube tu primera foto!' : 'No hay fotos'}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
            {isOwnProfile
              ? 'Comparte momentos especiales con tus amigos.'
              : 'Este usuario no ha subido fotos todavía.'}
          </p>
          {isOwnProfile && (
            <button 
              onClick={() => setUploadPhotoOpen(true)}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5" />
              Subir fotos
            </button>
          )}
        </div>
      ) : null}
      
      {/* Modals */}
      {isOwnProfile && (
        <>
          <UploadPhotoDialog open={uploadPhotoOpen} onOpenChange={setUploadPhotoOpen} />
          <CreateAlbumDialog open={createAlbumOpen} onOpenChange={setCreateAlbumOpen} />
        </>
      )}
    </div>
  );
}
