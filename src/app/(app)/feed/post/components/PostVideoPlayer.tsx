'use client';

import { StreamVideo } from '@/components/media/StreamVideo';
import type { MediaFile } from '../interfaces/post.interfaces';

interface PostVideoPlayerProps {
  video: MediaFile;
  isLiveStream?: boolean;
}

export default function PostVideoPlayer({ video, isLiveStream = false }: PostVideoPlayerProps) {
  const isHLS = video.mimeType === 'application/x-mpegURL' || video.url.includes('.m3u8');

  // Cloudflare Stream path — iframe player handles HLS, captions, analytics.
  if (video.streamUid) {
    return (
      <div className="relative bg-black">
        <StreamVideo uid={video.streamUid} aspectRatio="16 / 9" />
        {isLiveStream && (
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 pointer-events-none">
            <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
            GRABACIÓN
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative bg-black aspect-video max-h-[600px]">
      {isHLS ? (
        // HLS Video (Live Stream)
        <div className="flex items-center justify-center h-full">
          <video
            controls
            className="w-full h-full max-h-[600px] object-contain"
            preload="metadata"
            playsInline
          >
            <source src={video.url} type="application/x-mpegURL" />
            Tu navegador no soporta videos HLS.
          </video>
          {isLiveStream && (
            <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
              GRABACIÓN
            </div>
          )}
        </div>
      ) : (
        // Video Normal (MP4, MOV, etc.)
        <video
          controls
          className="w-full h-full max-h-[600px] object-contain"
          preload="metadata"
          playsInline
          src={video.url}
        >
          Tu navegador no soporta el formato de video.
        </video>
      )}
      
      {video.duration && (
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
      )}
    </div>
  );
}

/**
 * Formatea duración de segundos a MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
