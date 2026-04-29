'use client';

import { useState, useEffect } from 'react';
import { VideoCameraIcon, UserIcon, FolderIcon, ArrowPathIcon, PlayIcon } from '@/components/icons/heroicons-shim';
import { HeartIcon, EyeIcon, PlusIcon } from '@/components/icons/heroicons-shim';
import { useAuth } from '@/features/auth';
import { useProfileMediaStore } from '@/features/profile/store/profile-media.store';
import { ProfileVideo } from '@/features/profile/services/profile-media.service';
import UploadVideoDialog from '@/features/profile/components/dialogs/UploadVideoDialog';
import CreateAlbumDialog from '@/features/profile/components/dialogs/CreateAlbumDialog';
import MediaReactionButton from '@/features/profile/components/media/MediaReactionButton';
import MediaCommentsSection from '@/features/profile/components/media/MediaCommentsSection';
import VideoViewToggle, { VideoViewMode } from '@/features/profile/components/media/VideoViewToggle';
import VideoCardView from '@/features/profile/components/media/VideoCardView';
import VideoListView from '@/features/profile/components/media/VideoListView';
import Image from 'next/image';

type FilterType = 'all' | 'albums' | 'recent';

const filters: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Todos mis videos' },
  { id: 'albums', label: 'Álbumes' },
  { id: 'recent', label: 'Recientes' },
];

export default function FeedVideosPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Cargar preferencia de vista desde localStorage
  const [viewMode, setViewMode] = useState<VideoViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('videoViewMode');
      return (saved as VideoViewMode) || 'grid';
    }
    return 'grid';
  });
  
  const [selectedVideo, setSelectedVideo] = useState<ProfileVideo | null>(null);
  const [uploadVideoOpen, setUploadVideoOpen] = useState(false);
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  // Guardar preferencia de vista
  const handleViewModeChange = (mode: VideoViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('videoViewMode', mode);
    }
  };

  const { 
    videos, 
    albums, 
    isLoadingVideos, 
    isLoadingAlbums,
    fetchMyVideos, 
    fetchMyAlbums 
  } = useProfileMediaStore();

  useEffect(() => {
    fetchMyVideos();
    fetchMyAlbums();
  }, [fetchMyVideos, fetchMyAlbums]);

  // Filtrar videos según el filtro activo
  const filteredVideos = (() => {
    if (activeFilter === 'albums' && selectedAlbumId) {
      return videos.filter(video => video.albumId === selectedAlbumId);
    }
    if (activeFilter === 'recent') {
      return [...videos].sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      ).slice(0, 20);
    }
    return videos;
  })();

  // Encontrar álbum seleccionado
  const selectedAlbum = selectedAlbumId 
    ? albums.find(album => album.id === selectedAlbumId)
    : null;

  // Formatear duración de video
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <VideoCameraIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Mis Videos
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {videos.length} {videos.length === 1 ? 'video' : 'videos'}
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
                onClick={() => setUploadVideoOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-purple-500/30"
              >
                <PlusIcon className="w-5 h-5" />
                Subir videos
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between gap-4">
            {/* Filter tabs */}
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
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* View mode toggle */}
            <VideoViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
          </div>

          {/* Breadcrumb if album selected */}
          {selectedAlbum && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <button
                onClick={() => {
                  setSelectedAlbumId(null);
                  setActiveFilter('albums');
                }}
                className="text-purple-600 dark:text-purple-400 hover:underline"
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
        {(isLoadingVideos || isLoadingAlbums) && (
          <div className="flex justify-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-purple-600 animate-spin" />
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
                  Crea tu primer álbum para organizar tus videos
                </p>
                <button
                  onClick={() => setCreateAlbumOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
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
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                        <FolderIcon className="w-16 h-16 text-purple-400 dark:text-purple-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                      <h3 className="text-white font-semibold text-lg mb-1">
                        {album.name}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {album.videosCount} {album.videosCount === 1 ? 'video' : 'videos'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Videos Grid */}
        {!isLoadingVideos && (activeFilter !== 'albums' || selectedAlbumId) && (
          <>
            {filteredVideos.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <VideoCameraIcon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedAlbumId ? 'Este álbum está vacío' : 'No hay videos disponibles'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {selectedAlbumId 
                    ? 'Sube videos a este álbum para comenzar.'
                    : 'Sube tu primer video para comenzar tu colección.'
                  }
                </p>
                <button
                  onClick={() => setUploadVideoOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Subir videos
                </button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                  : viewMode === 'card'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'flex flex-col gap-3'
              }>
                {filteredVideos.map((video) => (
                  viewMode === 'grid' ? (
                    // Vista Grid (original)
                    <div
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className="group relative aspect-video rounded-lg overflow-hidden cursor-pointer bg-gray-200 dark:bg-gray-800 hover:shadow-xl transition-all duration-300"
                    >
                      {video.thumbnailUrl ? (
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.caption || 'Video'}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 dark:bg-gray-700">
                          <VideoCameraIcon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}
                      
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                          <PlayIcon className="w-8 h-8 text-purple-600 ml-1" />
                        </div>
                      </div>
                      
                      {/* Video info overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                        {/* Caption if exists */}
                        {video.caption && (
                          <div className="text-white text-sm line-clamp-2">
                            {video.caption}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <HeartIcon className="w-4 h-4" />
                              <span className="text-xs">{video.likes || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <EyeIcon className="w-4 h-4" />
                              <span className="text-xs">{video.viewsCount || 0}</span>
                            </div>
                          </div>
                          {video.duration && (
                            <div className="px-2 py-1 bg-black/80 rounded text-xs">
                              {formatDuration(video.duration)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : viewMode === 'card' ? (
                    // Vista Card (tipo YouTube)
                    <VideoCardView
                      key={video.id}
                      video={video}
                      onVideoClick={setSelectedVideo}
                      formatDuration={formatDuration}
                    />
                  ) : (
                    // Vista Lista (compacta)
                    <VideoListView
                      key={video.id}
                      video={video}
                      onVideoClick={setSelectedVideo}
                      formatDuration={formatDuration}
                    />
                  )
                ))}
              </div>
            )}
          </>
        )}

        {/* Video Modal */}
        {selectedVideo && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold z-10"
            >
              ✕
            </button>
            <div
              className="max-w-6xl w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid md:grid-cols-2">
                {/* Video Player */}
                <div className="bg-black flex items-center justify-center relative min-h-[400px] md:min-h-[600px]">
                  <video
                    src={selectedVideo.url}
                    controls
                    autoPlay
                    className="w-full h-full"
                    poster={selectedVideo.thumbnailUrl}
                  >
                    Tu navegador no soporta el elemento de video.
                  </video>
                </div>

                {/* Video Info */}
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
                  {selectedVideo.caption && (
                    <div className="mb-6">
                      <p className="text-gray-800 dark:text-gray-200">
                        {selectedVideo.caption}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {selectedVideo.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm"
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
                      entityType="video"
                      entityId={selectedVideo.id}
                      initialLikesCount={selectedVideo.likesCount || 0}
                    />
                  </div>

                  {/* Comments Section */}
                  <div className="flex-1 overflow-hidden">
                    <MediaCommentsSection
                      entityType="video"
                      entityId={selectedVideo.id}
                      initialCommentsCount={selectedVideo.commentsCount || 0}
                    />
                  </div>

                  {/* Date and visibility */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {new Date(selectedVideo.uploadedAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded capitalize">
                        {selectedVideo.visibility === 'public' ? 'Público' : 
                         selectedVideo.visibility === 'friends' ? 'Amigos' : 'Solo yo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dialogs */}
        <UploadVideoDialog 
          open={uploadVideoOpen} 
          onOpenChange={setUploadVideoOpen}
        />
        <CreateAlbumDialog 
          open={createAlbumOpen} 
          onOpenChange={setCreateAlbumOpen}
        />
      </div>
    </div>
  );
}
