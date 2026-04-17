import { FC } from 'react';
import type { Club } from '../types/club.types';
import { ClubCard } from './ClubCard';

interface ClubsGridProps {
  clubs: Club[];
  onJoin?: (clubId: string) => void;
  onLeave?: (clubId: string) => void;
  loadingClubId?: string | null;
  emptyMessage?: string;
}

export const ClubsGrid: FC<ClubsGridProps> = ({
  clubs,
  onJoin,
  onLeave,
  loadingClubId,
  emptyMessage = 'No se encontraron clubes',
}) => {
  if (clubs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center">
          <svg
            className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {emptyMessage}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Explora diferentes categorías o ajusta tus filtros para descubrir clubes interesantes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
      {clubs.map((club) => (
        <ClubCard
          key={club.id}
          club={club}
          onJoin={onJoin}
          onLeave={onLeave}
          isLoading={loadingClubId === club.id}
        />
      ))}
    </div>
  );
};
