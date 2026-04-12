'use client';

import { useState, useEffect } from 'react';
import { PhotoIcon, UserIcon, FolderIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { HeartIcon, ChatBubbleOvalLeftIcon, PlusIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/features/auth';
import { useProfileMediaStore } from '@/features/profile/store/profile-media.store';
import { ProfilePhoto } from '@/features/profile/services/profile-media.service';
import UploadPhotoDialog from '@/features/profile/components/dialogs/UploadPhotoDialog';
import CreateAlbumDialog from '@/features/profile/components/dialogs/CreateAlbumDialog';
import MediaReactionButton from '@/features/profile/components/media/MediaReactionButton';
import MediaCommentsSection from '@/features/profile/components/media/MediaCommentsSection';
import Image from 'next/image';

type FilterType = 'all' | 'albums' | 'recent';

const filters: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Todas mis fotos' },
  { id: 'albums', label: 'Álbumes' },
  { id: 'recent', label: 'Recientes' },
];

export default function FeedFotosPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<ProfilePhoto | null>(null);
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const { 
    photos, 
    albums, 
    isLoadingPhotos, 
    isLoadingAlbums,
    fetchMyPhotos, 
    fetchMyAlbums 
  } = useProfileMediaStore();

  useEffect(() => {
    fetchMyPhotos();
    fetchMyAlbums();
  }, [fetchMyPhotos, fetchMyAlbums]);

  // Filtrar fotos según el filtro activo
  const filteredPhotos = (() => {
    if (activeFilter === 'albums' && selectedAlbumId) {
      return photos.filter(photo => photo.albumId === selectedAlbumId);
    }
    if (activeFilter === 'recent') {
      return [...photos].sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      ).slice(0, 20);
    }
    return photos;
  })();

  // Encontrar álbum seleccionado
  const selectedAlbum = selectedAlbumId 
    ? albums.find(album => album.id === selectedAlbumId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <PhotoIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Mis Fotos
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCreateAlbumOpen(true)}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <FolderIcon className="w-5 h-5 inline mr-2" />
                Nuevo álbum
              </button>
              <button
                onClick={() => setUploadPhotoOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/30"
              >
                <PlusIcon className="w-5 h-5" />
                Subir fotos
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setActiveFilter(filter.id);
                  if (filter.id !== 'albums') {
                    setSelectedAlbumId(null);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Breadcrumb if album selected */}
          {selectedAlbum && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <button
                onClick={() => {
                  setSelectedAlbumId(null);
                  setActiveFilter('albums');
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Álbumes
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {selectedAlbum.name}
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {(isLoadingPhotos || isLoadingAlbums) && (
          <div className="flex justify-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        )}

        {/* Albums View */}
        {!isLoadingAlbums && activeFilter === 'albums' && !selectedAlbumId && (
          <div>
            {albums.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <FolderIcon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No tienes álbumes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Crea tu primer álbum para organizar tus fotos
                </p>
                <button
                  onClick={() => setCreateAlbumOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Crear álbum
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {albums.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => setSelectedAlbumId(album.id)}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    {album.coverPhotoUrl ? (
                      <Image
                        src={album.coverPhotoUrl}
                        alt={album.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                        <FolderIcon className="w-16 h-16 text-indigo-400 dark:text-indigo-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                      <h3 className="text-white font-semibold text-lg mb-1">
                        {album.name}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {album.photosCount} {album.photosCount === 1 ? 'foto' : 'fotos'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Photos Grid */}
        {!isLoadingPhotos && (activeFilter !== 'albums' || selectedAlbumId) && (
          <>
            {filteredPhotos.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <PhotoIcon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedAlbumId ? 'Este álbum está vacío' : 'No hay fotos disponibles'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {selectedAlbumId 
                    ? 'Sube fotos a este álbum para comenzar.'
                    : 'Sube tu primera foto para comenzar tu colección.'
                  }
                </p>
                <button
                  onClick={() => setUploadPhotoOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Subir fotos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-200 dark:bg-gray-800 hover:shadow-xl transition-all duration-300"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption || 'Foto'}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                      {/* Caption if exists */}
                      {photo.caption && (
                        <div className="text-white text-sm line-clamp-2">
                          {photo.caption}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <HeartIcon className="w-5 h-5" />
                          <span className="text-sm">{photo.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <PhotoIcon className="w-5 h-5" />
                          <span className="text-xs">
                            {new Date(photo.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Photo Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold z-10"
            >
              ✕
            </button>
            <div
              className="max-w-6xl w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid md:grid-cols-2">
                <div className="bg-black flex items-center justify-center relative min-h-[400px] md:min-h-[600px]">
                  <Image
                    src={selectedPhoto.url}
                    alt={selectedPhoto.caption || 'Foto'}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="p-6 flex flex-col">
                  {/* User info */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.username || 'User'}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{user?.username}
                      </p>
                    </div>
                  </div>

                  {/* Caption */}
                  {selectedPhoto.caption && (
                    <div className="mb-6">
                      <p className="text-gray-800 dark:text-gray-200">
                        {selectedPhoto.caption}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {selectedPhoto.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="mb-6">
                    <MediaReactionButton
                      entityType="photo"
                      entityId={selectedPhoto.id}
                      initialLikesCount={selectedPhoto.likesCount || 0}
                    />
                  </div>

                  {/* Comments Section */}
                  <div className="flex-1 overflow-hidden">
                    <MediaCommentsSection
                      entityType="photo"
                      entityId={selectedPhoto.id}
                      initialCommentsCount={selectedPhoto.commentsCount || 0}
                    />
                  </div>

                  {/* Date and visibility */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {new Date(selectedPhoto.uploadedAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded capitalize">
                        {selectedPhoto.visibility === 'public' ? 'Público' : 
                         selectedPhoto.visibility === 'friends' ? 'Amigos' : 'Solo yo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dialogs */}
        <UploadPhotoDialog 
          open={uploadPhotoOpen} 
          onOpenChange={setUploadPhotoOpen}
        />
        <CreateAlbumDialog 
          open={createAlbumOpen} 
          onOpenChange={setCreateAlbumOpen}
        />
      </div>
    </div>
  );
}
