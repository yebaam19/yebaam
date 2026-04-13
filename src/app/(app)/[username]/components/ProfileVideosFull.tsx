'use client';

import { useState, useEffect } from 'react';
import { PlayIcon, EyeIcon, HeartIcon, ChatBubbleLeftIcon, FolderIcon, TagIcon, Squares2X2Icon, ListBulletIcon, CloudArrowUpIcon } from '@/components/icons/heroicons-shim';
import { HeartIcon as HeartSolidIcon } from '@/components/icons/heroicons-shim';
import UploadVideoDialog from '@/features/profile/components/dialogs/UploadVideoDialog';
import { useProfileMediaStore } from '@/features/profile/store/profile-media.store';

interface Video {
  id: string;
  thumbnailUrl: string;
  title?: string;
  duration: string; // "5:32"
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
}

interface ProfileVideosFullProps {
  username: string;
  videos: Video[];
  totalVideos: number;
  isOwnProfile: boolean;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'playlists' | 'tagged';

export default function ProfileVideosFull({ username, videos, totalVideos, isOwnProfile }: ProfileVideosFullProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [uploadVideoOpen, setUploadVideoOpen] = useState(false);
  
  // Cargar álbumes si es el perfil propio
  const { fetchMyAlbums, albums } = useProfileMediaStore();
  
  useEffect(() => {
    if (isOwnProfile && albums.length === 0) {
      fetchMyAlbums();
    }
  }, [isOwnProfile, albums.length, fetchMyAlbums]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
  };

  if (videos.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/10 to-pink-500/10 flex items-center justify-center">
            <PlayIcon className="w-10 h-10 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              {isOwnProfile ? 'No has subido videos' : 'No hay videos'}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-sm">
              {isOwnProfile
                ? 'Comparte tus momentos favoritos en video con tus amigos.'
                : `${username} aún no ha compartido videos.`}
            </p>
          </div>
          {isOwnProfile && (
            <button className="mt-4 px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-red-500/25">
              Subir video
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Filtros */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Todos los videos ({totalVideos})
            </button>
            <button
              onClick={() => setFilter('playlists')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                filter === 'playlists'
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <FolderIcon className="w-4 h-4" />
              Listas
            </button>
            <button
              onClick={() => setFilter('tagged')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                filter === 'tagged'
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <TagIcon className="w-4 h-4" />
              Etiquetado
            </button>
          </div>

          {/* Controles de vista */}
          <div className="flex items-center gap-2">
            {isOwnProfile && (
              <button 
                onClick={() => setUploadVideoOpen(true)}
                className="px-4 py-2 bg-linear-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-red-500/25 flex items-center gap-2"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Subir video</span>
              </button>
            )}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-neutral-700 text-red-500 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-700 text-red-500 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de videos */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="group bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-red-500/10 hover:border-red-500/50 transition-all duration-300 cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title || 'Video'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                      <PlayIcon className="w-6 h-6 text-red-500 ml-1" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-white">
                    {video.duration}
                  </div>
                </div>
                {/* Stats overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded-lg flex items-center gap-1.5">
                    <EyeIcon className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-semibold text-white">{formatNumber(video.views)}</span>
                  </div>
                </div>
              </div>

              {/* Video info */}
              {video.title && (
                <div className="p-4">
                  <h3 className="font-semibold text-neutral-900 dark:text-white line-clamp-2 mb-2 group-hover:text-red-500 transition-colors duration-200">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                      <HeartSolidIcon className="w-4 h-4 text-red-500" />
                      <span>{formatNumber(video.likes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span>{formatNumber(video.comments)}</span>
                    </div>
                    <span className="text-xs">{formatDate(video.createdAt)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Lista de videos */
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {videos.map((video) => (
              <div
                key={video.id}
                className="group flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200 cursor-pointer"
              >
                {/* Thumbnail pequeño */}
                <div className="relative flex-shrink-0 w-40 aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title || 'Video'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-200 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                      <PlayIcon className="w-4 h-4 text-red-500 ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/90 backdrop-blur-sm rounded text-xs font-semibold text-white">
                    {video.duration}
                  </div>
                </div>

                {/* Info del video */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 dark:text-white line-clamp-1 mb-1 group-hover:text-red-500 transition-colors duration-200">
                    {video.title || 'Video sin título'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <EyeIcon className="w-4 h-4" />
                      <span>{formatNumber(video.views)} vistas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HeartSolidIcon className="w-4 h-4 text-red-500" />
                      <span>{formatNumber(video.likes)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span>{formatNumber(video.comments)}</span>
                    </div>
                    <span className="hidden md:inline">•</span>
                    <span className="hidden md:inline text-xs">{formatDate(video.createdAt)}</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex-shrink-0">
                  <button className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors duration-200">
                    <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Modal */}
      {isOwnProfile && (
        <UploadVideoDialog open={uploadVideoOpen} onOpenChange={setUploadVideoOpen} />
      )}
    </div>
  );
}
