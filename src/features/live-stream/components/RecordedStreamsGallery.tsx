'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { liveStreamService } from '../services/live-stream.service';
import { PlayIcon, ClockIcon, EyeIcon } from '@/components/icons/heroicons-shim';

interface RecordedStream {
  id: string;
  title: string;
  description?: string;
  playbackUrl?: string;
  recordingUrl?: string;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
  };
  stats: {
    duration: number;
    viewerCount: number;
    peakViewerCount: number;
    endedAt?: string;
  };
  privacy: string;
  createdAt: string;
}

interface RecordedStreamsGalleryProps {
  onPlayStream?: (stream: RecordedStream) => void;
}

export default function RecordedStreamsGallery({ onPlayStream }: RecordedStreamsGalleryProps) {
  const t = useTranslations('liveStream');
  const [streams, setStreams] = useState<RecordedStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchRecordedStreams();
  }, []);

  const fetchRecordedStreams = async () => {
    try {
      setIsLoading(true);
      const response = await liveStreamService.getRecordedStreams(12, cursor);
      
      console.log(' Recorded Streams Response:', response);
      
      if (response.streams && response.streams.length > 0) {
        console.log(' First stream:', response.streams[0]);
        setStreams(prev => cursor ? [...prev, ...response.streams] : response.streams);
        setHasMore(response.pagination?.hasMore || false);
        setCursor(response.pagination?.nextCursor);
      }
    } catch (error) {
      console.error('Error al obtener transmisiones grabadas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return t('recorded.timeAgo.lessThanHour');
    } else if (diffInHours < 24) {
      return diffInHours === 1
        ? t('recorded.timeAgo.hoursOne', { count: diffInHours })
        : t('recorded.timeAgo.hoursOther', { count: diffInHours });
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1
        ? t('recorded.timeAgo.daysOne', { count: diffInDays })
        : t('recorded.timeAgo.daysOther', { count: diffInDays });
    }
  };

  const getAuthorDisplayName = (author: RecordedStream['author']) => {
    const fullName = `${author.firstName} ${author.lastName || ''}`.trim();
    return fullName || author.username;
  };

  if (isLoading && streams.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {t('recorded.heading')}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-neutral-200 dark:bg-neutral-800 aspect-video rounded-lg mb-3"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && streams.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {t('recorded.heading')}
          </h2>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4"></div>
          <p className="text-neutral-500 dark:text-neutral-400">
            {t('recorded.empty')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
           Transmisiones Grabadas
        </h2>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {streams.length === 1
            ? t('recorded.countOne', { count: streams.length })
            : t('recorded.countOther', { count: streams.length })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {streams.map((stream) => (
          <div
            key={stream.id}
            className="group cursor-pointer"
            onClick={() => onPlayStream?.(stream)}
          >
            {/* Thumbnail con overlay */}
            <div className="relative aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden mb-3">
              {/* Placeholder background con gradiente */}
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 to-pink-500/20"></div>
              
              {/* Processing badge si no hay recordingUrl */}
              {!stream.recordingUrl && (
                <div className="absolute top-2 left-2 bg-yellow-600 px-2 py-1 rounded text-xs font-semibold text-white flex items-center gap-1">
                  <ClockIcon className="h-3 w-3 animate-spin" />
                  {t('recorded.processing')}
                </div>
              )}
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 rounded-full p-4">
                  <PlayIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold text-white flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {formatDuration(stream.stats.duration)}
              </div>

              {/* Views badge */}
              <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold text-white flex items-center gap-1">
                <EyeIcon className="h-3 w-3" />
                {stream.stats.peakViewerCount}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  {stream.author.avatar ? (
                    <img
                      src={stream.author.avatar}
                      alt={getAuthorDisplayName(stream.author)}
                      className="h-6 w-6 rounded-full object-cover"
                      decoding="async"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                      {stream.author.firstName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {getAuthorDisplayName(stream.author)}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-neutral-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {stream.title}
              </h3>

              {/* Date */}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {stream.stats.endedAt && formatDate(stream.stats.endedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={fetchRecordedStreams}
            disabled={isLoading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? t('recorded.loading') : t('recorded.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
