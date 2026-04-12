'use client';

import { Squares2X2Icon, ListBulletIcon, TableCellsIcon } from '@heroicons/react/24/outline';

export type VideoViewMode = 'grid' | 'card' | 'list';

interface VideoViewToggleProps {
  viewMode: VideoViewMode;
  onViewModeChange: (mode: VideoViewMode) => void;
}

const viewOptions = [
  { 
    id: 'grid' as VideoViewMode, 
    icon: Squares2X2Icon, 
    label: 'Cuadrícula',
    description: 'Vista compacta tipo Instagram'
  },
  { 
    id: 'card' as VideoViewMode, 
    icon: TableCellsIcon, 
    label: 'Tarjetas',
    description: 'Vista detallada tipo YouTube'
  },
  { 
    id: 'list' as VideoViewMode, 
    icon: ListBulletIcon, 
    label: 'Lista',
    description: 'Vista compacta con información'
  },
];

export default function VideoViewToggle({ viewMode, onViewModeChange }: VideoViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {viewOptions.map((option) => {
        const Icon = option.icon;
        const isActive = viewMode === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => onViewModeChange(option.id)}
            className={`
              group relative flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all
              ${isActive 
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
            title={option.description}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">{option.label}</span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              {option.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
