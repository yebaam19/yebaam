import { Community } from '../types/community.types';
import { CommunityCard } from './CommunityCard';

interface CommunitiesGridProps {
  communities: Community[];
  onJoinClick?: (community: Community) => void;
  loadingCommunityId?: string | null;
  emptyMessage?: string;
}

export function CommunitiesGrid({
  communities,
  onJoinClick,
  loadingCommunityId,
  emptyMessage = 'No se encontraron comunidades',
}: CommunitiesGridProps) {
  if (communities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-600">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {communities.map((community) => (
        <CommunityCard
          key={community.id}
          community={community}
          onJoinClick={onJoinClick}
          isLoading={loadingCommunityId === community.id}
        />
      ))}
    </div>
  );
}
