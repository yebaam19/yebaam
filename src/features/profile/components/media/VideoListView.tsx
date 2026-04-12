'use client';

import { PlayIcon, EyeIcon, HeartIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { ProfileVideo } from '@/features/profile/services/profile-media.service';
import Image from 'next/image';

interface VideoListViewProps {
  video: ProfileVideo;
  onVideoClick: (video: ProfileVideo) => void;
  formatDuration: (seconds?: number) => string;
}

/**
 * Vista Lista compacta estilo Google Drive
 * Muestra información condensada en formato horizontal
 */
export default function VideoListView({ video, onVideoClick, formatDuration }: VideoListViewProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <div className="group flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors border border-gray-200 dark:border-gray-700">
      {/* Thumbnail compacto */}
      <div 
        className="relative w-32 h-20 shrink-0 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden cursor-pointer"
        onClick={() => onVideoClick(video)}
      >
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.caption || 'Video'}
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayIcon className="w-10 h-10 text-gray-400" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <PlayIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Duration */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs font-semibold rounded">
          {formatDuration(video.duration)}
        </div>
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <h3 
          className="text-sm font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-1"
          onClick={() => onVideoClick(video)}
        >
          {video.caption || 'Sin título'}
        </h3>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <EyeIcon className="w-3.5 h-3.5" />
            <span>{video.viewsCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <HeartIcon className="w-3.5 h-3.5 text-red-500" />
            <span>{video.likesCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
            <span>{video.commentsCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Metadata adicional (oculto en móvil) */}
      <div className="hidden md:flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
        {/* Duración */}
        <div className="flex items-center gap-1.5">
          <ClockIcon className="w-4 h-4" />
          <span>{formatDuration(video.duration)}</span>
        </div>

        {/* Fecha */}
        <div className="flex items-center gap-1.5 min-w-[100px]">
          <CalendarIcon className="w-4 h-4" />
          <span>{formatDate(video.uploadedAt)}</span>
        </div>

        {/* Resolución */}
        {video.width && video.height && (
          <div className="min-w-[70px]">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
              {video.height}p
            </span>
          </div>
        )}
      </div>

      {/* Menu de acciones */}
      <button 
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100"
        title="Más opciones"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
}
