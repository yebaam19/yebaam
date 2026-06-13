'use client';

import VideoViewToggle, { VideoViewMode } from '@/features/profile/components/media/VideoViewToggle';
import { ProfileAlbum } from '@/features/profile/services/profile-media.service';

export type FilterType = 'all' | 'albums' | 'recent';

const filters: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Todos mis videos' },
  { id: 'albums', label: 'Álbumes' },
  { id: 'recent', label: 'Recientes' },
];

interface VideosFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  viewMode: VideoViewMode;
  onViewModeChange: (mode: VideoViewMode) => void;
  selectedAlbum: ProfileAlbum | null;
  onBackToAlbums: () => void;
}

export default function VideosFilters({
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  selectedAlbum,
  onBackToAlbums,
}: VideosFiltersProps) {
  return (
    <>
      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
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
        <VideoViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      {/* Breadcrumb if album selected */}
      {selectedAlbum && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button
            onClick={onBackToAlbums}
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
    </>
  );
}
