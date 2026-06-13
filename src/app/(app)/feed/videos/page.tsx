'use client';

import { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@/components/icons/heroicons-shim';
import { useAuth } from '@/features/auth';
import { useProfileMediaStore } from '@/features/profile/store/profile-media.store';
import { ProfileVideo } from '@/features/profile/services/profile-media.service';
import UploadVideoDialog from '@/features/profile/components/dialogs/UploadVideoDialog';
import CreateAlbumDialog from '@/features/profile/components/dialogs/CreateAlbumDialog';
import { VideoViewMode } from '@/features/profile/components/media/VideoViewToggle';
import VideosHeader from './_components/VideosHeader';
import VideosFilters, { FilterType } from './_components/VideosFilters';
import AlbumsGrid from './_components/AlbumsGrid';
import VideosGrid from './_components/VideosGrid';
import VideoModal from './_components/VideoModal';

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

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    if (filter !== 'albums') {
      setSelectedAlbumId(null);
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
          <VideosHeader
            videosCount={videos.length}
            onCreateAlbum={() => setCreateAlbumOpen(true)}
            onUploadVideo={() => setUploadVideoOpen(true)}
          />

          <VideosFilters
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            selectedAlbum={selectedAlbum ?? null}
            onBackToAlbums={() => {
              setSelectedAlbumId(null);
              setActiveFilter('albums');
            }}
          />
        </div>

        {/* Loading State */}
        {(isLoadingVideos || isLoadingAlbums) && (
          <div className="flex justify-center py-20">
            <ArrowPathIcon className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}

        {/* Albums View */}
        {!isLoadingAlbums && activeFilter === 'albums' && !selectedAlbumId && (
          <AlbumsGrid
            albums={albums}
            onCreateAlbum={() => setCreateAlbumOpen(true)}
            onSelectAlbum={setSelectedAlbumId}
          />
        )}

        {/* Videos Grid */}
        {!isLoadingVideos && (activeFilter !== 'albums' || selectedAlbumId) && (
          <VideosGrid
            videos={filteredVideos}
            viewMode={viewMode}
            selectedAlbumId={selectedAlbumId}
            onVideoClick={setSelectedVideo}
            onUploadVideo={() => setUploadVideoOpen(true)}
            formatDuration={formatDuration}
          />
        )}

        {/* Video Modal */}
        {selectedVideo && (
          <VideoModal
            video={selectedVideo}
            user={user}
            onClose={() => setSelectedVideo(null)}
          />
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
