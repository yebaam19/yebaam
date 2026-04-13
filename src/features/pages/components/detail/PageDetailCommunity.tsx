import { FC } from 'react';
import { UsersIcon, ShieldCheckIcon } from '@/components/icons/heroicons-shim';
import Image from 'next/image';
import { getRoleColor, getRoleLabel } from '../../utils/pageHelpers';
import type { PageRole } from '../../types/page.types';

interface PageDetailCommunityProps {
  pageId: string;
}

// Mock followers
const mockFollowers = [
  {
    id: '1',
    name: 'Ana García',
    username: 'ana-garcia',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'OWNER' as PageRole,
  },
  {
    id: '2',
    name: 'Carlos López',
    username: 'carlos-lopez',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'ADMIN' as PageRole,
  },
  {
    id: '3',
    name: 'María Rodríguez',
    username: 'maria-rodriguez',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: 'EDITOR' as PageRole,
  },
  {
    id: '4',
    name: 'Juan Martínez',
    username: 'juan-martinez',
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: '5',
    name: 'Laura Sánchez',
    username: 'laura-sanchez',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: '6',
    name: 'Pedro Gómez',
    username: 'pedro-gomez',
    avatar: 'https://i.pravatar.cc/150?img=6',
  },
];

export const PageDetailCommunity: FC<PageDetailCommunityProps> = ({ pageId }) => {
  // TODO: Fetch real followers from API
  
  const teamMembers = mockFollowers.filter((f) => f.role);
  const regularFollowers = mockFollowers.filter((f) => !f.role);

  return (
    <div className="space-y-6">
      {/* Team Members */}
      {teamMembers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheckIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Equipo ({teamMembers.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <Image
                      src={member.avatar}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{member.username}
                    </p>
                  </div>
                </div>
                
                {member.role && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                      member.role
                    )}`}
                  >
                    {getRoleLabel(member.role)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Followers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <UsersIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Seguidores ({regularFollowers.length})
          </h3>
        </div>
        
        {regularFollowers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {regularFollowers.map((follower) => (
              <div
                key={follower.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                  <Image
                    src={follower.avatar}
                    alt={follower.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {follower.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    @{follower.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aún no hay seguidores
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
