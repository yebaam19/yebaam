'use client';

import type { MediaFile } from '../interfaces/post.interfaces';
import PostImageGallery from './PostImageGallery';
import PostVideoPlayer from './PostVideoPlayer';

interface PostMediaProps {
  mediaFiles: MediaFile[];
  isLiveStream?: boolean;
}

export default function PostMedia({ mediaFiles, isLiveStream = false }: PostMediaProps) {
  if (!mediaFiles || mediaFiles.length === 0) return null;

  // Filtrar por tipo (case-insensitive)
  const images = mediaFiles.filter((file) => file.type?.toUpperCase() === 'IMAGE');
  const videos = mediaFiles.filter((file) => file.type?.toUpperCase() === 'VIDEO');


  return (
    <div className="space-y-2">
      {/* Videos */}
      {videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((video) => (
            <PostVideoPlayer 
              key={video.id || video.url} 
              video={video} 
              isLiveStream={isLiveStream}
            />
          ))}
        </div>
      )}

      {/* Imágenes */}
      {images.length > 0 && (
        <PostImageGallery images={images} />
      )}
    </div>
  );
}
