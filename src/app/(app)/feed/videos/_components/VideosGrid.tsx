'use client';

import { VideoCameraIcon, PlayIcon, HeartIcon, EyeIcon, PlusIcon } from '@/components/icons/heroicons-shim';
import { ProfileVideo } from '@/features/profile/services/profile-media.service';
import { VideoViewMode } from '@/features/profile/components/media/VideoViewToggle';
import VideoCardView from '@/features/profile/components/media/VideoCardView';
import VideoListView from '@/features/profile/components/media/VideoListView';
import Image from 'next/image';

interface VideosGridProps {
  videos: ProfileVideo[];
  viewMode: VideoViewMode;
  selectedAlbumId: string | null;
  onVideoClick: (video: ProfileVideo) => void;
  onUploadVideo: () => void;
  formatDuration: (seconds?: number) => string;
}

export default function VideosGrid({
  videos,
  viewMode,
  selectedAlbumId,
  onVideoClick,
  onUploadVideo,
  formatDuration,
}: VideosGridProps) {
  if (videos.length === 0) {
    return (
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
          onClick={onUploadVideo}
          className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Subir videos
        </button>
      </div>
    );
  }

  return (
    <div className={
      viewMode === 'grid'
        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
        : viewMode === 'card'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'flex flex-col gap-3'
    }>
      {videos.map((video) => (
        viewMode === 'grid' ? (
          // Vista Grid (original)
          <div
            key={video.id}
            onClick={() => onVideoClick(video)}
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
            onVideoClick={onVideoClick}
            formatDuration={formatDuration}
          />
        ) : (
          // Vista Lista (compacta)
          <VideoListView
            key={video.id}
            video={video}
            onVideoClick={onVideoClick}
            formatDuration={formatDuration}
          />
        )
      ))}
    </div>
  );
}
