import Image from 'next/image';
import { CheckBadgeIcon } from '@/components/icons/heroicons-shim';
import {
  getRoleColor,
  getRoleLabel,
} from '@/features/communities/utils/communityHelpers';
import type { CommunityMember } from '@/features/communities/types/community.types';

interface CommunityMembersPanelProps {
  members: CommunityMember[];
  total: number;
}

export function CommunityMembersPanel({ members, total }: CommunityMembersPanelProps) {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Miembros y Seguidores
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">{total} en total</span>
      </header>
      {members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                {member.avatar && (
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    width={44}
                    height={44}
                    className="rounded-full"
                    unoptimized
                  />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1 truncate">
                    {member.name}
                    {member.isVerified && (
                      <CheckBadgeIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                  </p>
                  {member.username && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      @{member.username}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`inline-block text-[10px] font-medium px-2 py-1 rounded-full ${getRoleColor(member.role)}`}
              >
                {getRoleLabel(member.role)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center text-sm text-gray-600 dark:text-gray-400">
          No hay miembros disponibles.
        </div>
      )}
    </div>
  );
}
