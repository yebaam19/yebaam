import { FC } from 'react';
import { CheckBadgeIcon, UserPlusIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid';
import { CommunityMember } from '../../interfaces/community.interface';
import Image from 'next/image';
import Link from 'next/link';

interface CommunityMemberCardProps {
  member: CommunityMember;
  onFollow?: (memberId: string) => void;
  onMessage?: (memberId: string) => void;
}

export const CommunityMemberCard: FC<CommunityMemberCardProps> = ({
  member,
  onFollow,
  onMessage,
}) => {
  const fullName = `${member.firstName} ${member.lastName}`.trim();

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* User Info */}
      <Link
        href={`/${member.username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {member.avatar ? (
            <Image
              src={member.avatar}
              alt={fullName}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {member.firstName?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Name and Username */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {fullName}
            </h4>
            {member.isVerified && (
              <CheckBadgeIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            @{member.username}
          </p>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <button
          onClick={() => onMessage?.(member.id)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Enviar mensaje"
        >
          <ChatBubbleLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onFollow?.(member.id)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlusIcon className="w-4 h-4" />
          Seguir
        </button>
      </div>
    </div>
  );
};
