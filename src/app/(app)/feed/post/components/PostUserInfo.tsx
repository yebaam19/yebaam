import Avatar from '@/ui/Avatar';
import { GlobeAltIcon, UserGroupIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { getUserInitials } from '@/lib/user-helpers';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Público', icon: GlobeAltIcon, description: 'Cualquiera puede ver' },
  { value: 'friends', label: 'Amigos', icon: UserGroupIcon, description: 'Solo tus amigos' },
  { value: 'private', label: 'Solo yo', icon: LockClosedIcon, description: 'Solo tú' },
] as const;

interface PostUserInfoProps {
  userAvatar?: string;
  userName: string;
  selectedVisibility: 'public' | 'friends' | 'private';
  onVisibilityChange: (visibility: 'public' | 'friends' | 'private') => void;
}

export default function PostUserInfo({
  userAvatar,
  userName,
  selectedVisibility,
  onVisibilityChange,
}: PostUserInfoProps) {
  const initials = getUserInitials(userName);
  const selectedOption = VISIBILITY_OPTIONS.find(opt => opt.value === selectedVisibility) || VISIBILITY_OPTIONS[0];
  const SelectedIcon = selectedOption.icon;

  return (
    <div className="flex items-center gap-3">
      <Avatar src={userAvatar} initials={initials} className="h-12 w-12" />
      <div className="flex-1">
        <p className="font-semibold text-neutral-900 dark:text-white">
          {userName}
        </p>
        <div className="relative mt-1">
          <select
            value={selectedVisibility}
            onChange={(e) => onVisibilityChange(e.target.value as 'public' | 'friends' | 'private')}
            className="w-full appearance-none rounded-md border-0 bg-neutral-100 pl-7 pr-8 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            {VISIBILITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <SelectedIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400 pointer-events-none" />
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
