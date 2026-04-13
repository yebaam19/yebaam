import { FC, useRef } from 'react';
import {
  PlayIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
} from '@/components/icons/heroicons-shim';
import { HeartIcon as HeartSolidIcon } from '@/components/icons/heroicons-shim';
import { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';

interface ReelCardProps {
  reel: Post;
  onReelClick?: (reel: Post) => void;
  onLike?: (reel: Post) => void;
  onComment?: (reel: Post) => void;
  onShare?: (reel: Post) => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ReelCard: FC<ReelCardProps> = ({
  reel,
  onReelClick,
  onLike,
  onComment,
  onShare,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const video = reel.mediaFiles[0];
  const totalLikes = Object.values(reel.reactionsCount || {}).reduce((sum, count) => sum + count, 0);

  const handleCardClick = () => {
    if (onReelClick) {
      onReelClick(reel);
    }
  };

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.muted = true; // Silenciar el preview
      videoRef.current.play().catch((error) => {
        console.log('Error playing video preview:', error);
      });
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reiniciar al inicio
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      onLike(reel);
    } else {
      // TODO: Implementar like
      console.log('Like reel:', reel.id);
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onComment) {
      onComment(reel);
    } else {
      // TODO: Implementar comentarios
      console.log('Comment reel:', reel.id);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(reel);
    } else {
      // TODO: Implementar compartir
      console.log('Share reel:', reel.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
    >
      {/* Thumbnail/Video */}
      <div className="aspect-[9/16] relative">
        <video
          ref={videoRef}
          src={video.url}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          poster={video.thumbnailUrl || video.url}
          loop
          playsInline
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
            <PlayIcon className="w-6 h-6 text-gray-900 ml-0.5" />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs font-medium rounded">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="text-white text-sm font-medium mb-2 line-clamp-2">
            {reel.content || 'Sin título'}
          </h3>
          <div className="flex items-center gap-3 text-white text-xs">
            <div className="flex items-center gap-1">
              <HeartIcon className="w-4 h-4" />
              <span>{formatNumber(totalLikes)}</span>
            </div>
            {reel.commentsCount !== undefined && (
              <div className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>{formatNumber(reel.commentsCount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions (visible on hover) */}
      <div className="absolute top-2 left-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleLike}
          className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
          title="Me gusta"
        >
          {reel.currentUserReaction ? (
            <HeartSolidIcon className="w-5 h-5 text-red-500" />
          ) : (
            <HeartIcon className="w-5 h-5 text-gray-700" />
          )}
        </button>
        <button
          onClick={handleComment}
          className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
          title="Comentar"
        >
          <ChatBubbleLeftIcon className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={handleShare}
          className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
          title="Compartir"
        >
          <ShareIcon className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
};
