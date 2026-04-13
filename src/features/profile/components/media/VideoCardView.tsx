'use client';

import { PlayIcon, EyeIcon, HeartIcon, ClockIcon, CalendarIcon } from '@/components/icons/heroicons-shim';
import { ChatBubbleLeftIcon, EllipsisVerticalIcon } from '@/components/icons/heroicons-shim';
import { ProfileVideo } from '@/features/profile/services/profile-media.service';
import Image from 'next/image';

interface VideoCardViewProps {
  video: ProfileVideo;
  onVideoClick: (video: ProfileVideo) => void;
  formatDuration: (seconds?: number) => string;
}

/**
 * Vista Card estilo YouTube
 * Muestra el video con metadata detallada
 */
export default function VideoCardView({ video, onVideoClick, formatDuration }: VideoCardViewProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
    if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`;
    return `Hace ${Math.floor(diffInDays / 365)} años`;
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
      {/* Thumbnail */}
      <div 
        className="relative aspect-video bg-gray-100 dark:bg-gray-900 cursor-pointer overflow-hidden"
        onClick={() => onVideoClick(video)}
      >
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.caption || 'Video'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayIcon className="w-20 h-20 text-gray-400 dark:text-gray-600" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100">
            <PlayIcon className="w-6 h-6 text-gray-900 ml-1" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-xs font-semibold rounded">
          {formatDuration(video.duration)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Caption/Title */}
        <h3 
          className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          onClick={() => onVideoClick(video)}
        >
          {video.caption || 'Sin título'}
        </h3>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {video.tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                +{video.tags.length - 3} más
              </span>
            )}
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1" title="Vistas">
            <EyeIcon className="w-4 h-4" />
            <span>{video.viewsCount || 0}</span>
          </div>
          <div className="flex items-center gap-1" title="Me gusta">
            <HeartIcon className="w-4 h-4 text-red-500" />
            <span>{video.likesCount || 0}</span>
          </div>
          <div className="flex items-center gap-1" title="Comentarios">
            <ChatBubbleLeftIcon className="w-4 h-4" />
            <span>{video.commentsCount || 0}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{formatDate(video.uploadedAt)}</span>
          </div>

          {/* Actions menu */}
          <button 
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Más opciones"
          >
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
