import { FC, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Page, PageRole } from '../../types/page.types';
import {
  UserCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import { CheckBadgeIcon } from '@/components/icons/heroicons-shim';

interface SettingsRolesProps {
  page: Page;
}

interface TeamMember {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role: PageRole;
  joinedAt: Date;
}

// Mock team members
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    username: 'juanperez',
    avatar: 'https://i.pravatar.cc/150?img=12',
    role: 'OWNER',
    joinedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'María González',
    username: 'mariag',
    avatar: 'https://i.pravatar.cc/150?img=5',
    role: 'ADMIN',
    joinedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    name: 'Carlos López',
    username: 'carlosl',
    avatar: 'https://i.pravatar.cc/150?img=33',
    role: 'EDITOR',
    joinedAt: new Date('2024-02-01'),
  },
];

const ROLE_COLORS: Record<
  PageRole,
  { bg: string; text: string; border: string }
> = {
  OWNER: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  ADMIN: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  EDITOR: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  MODERATOR: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
};

const PAGE_ROLES: PageRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'MODERATOR'];

export const SettingsRoles: FC<SettingsRolesProps> = ({ page }) => {
  const t = useTranslations('pages.settings.roles');
  const locale = useLocale();
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleRoleChange = (memberId: string, newRole: PageRole) => {
    // TODO: Implement role change mutation
    console.log('Change role:', memberId, newRole);
  };

  const handleRemoveMember = (memberId: string) => {
    // TODO: Implement remove member mutation
    console.log('Remove member:', memberId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('heading')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('subheading')}
        </p>
      </div>

      {/* Add Member Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">
            {t('addMember')}
          </h3>
          <button
            onClick={() => setIsAddingMember(!isAddingMember)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {isAddingMember ? t('cancel') : t('addAction')}
          </button>
        </div>

        {isAddingMember && (
          <div className="space-y-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('searchHint')}
            </p>
          </div>
        )}
      </div>

      {/* Team Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
          {t('membersHeading', { count: teamMembers.length })}
        </h3>

        <div className="space-y-3">
          {teamMembers.map((member) => {
            const roleColor = ROLE_COLORS[member.role];
            const isOwner = member.role === 'OWNER';

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.name}
                    </p>
                    {isOwner && (
                      <CheckBadgeIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    @{member.username} · {t('joinedSince')}{' '}
                    {member.joinedAt.toLocaleDateString(locale, {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Role Badge */}
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${roleColor.bg} ${roleColor.text} ${roleColor.border}`}
                >
                  {t(`labels.${member.role}`)}
                </span>

                {/* Role Dropdown (if not owner) */}
                {!isOwner && page.userRole === 'OWNER' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value as PageRole)
                      }
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="ADMIN">{t('labels.ADMIN')}</option>
                      <option value="EDITOR">{t('labels.EDITOR')}</option>
                      <option value="MODERATOR">{t('labels.MODERATOR')}</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title={t('removeMember')}
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Reference */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
          {t('permissionsHeading')}
        </h3>

        <div className="space-y-4">
          {PAGE_ROLES.map((role) => {
            const roleColor = ROLE_COLORS[role];
            const permissions = t.raw(`permissions.${role}`) as string[];

            return (
              <div key={role}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${roleColor.bg} ${roleColor.text}`}
                  >
                    {t(`labels.${role}`)}
                  </span>
                </div>
                <ul className="space-y-1 ml-4">
                  {permissions.map((permission, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                    >
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
