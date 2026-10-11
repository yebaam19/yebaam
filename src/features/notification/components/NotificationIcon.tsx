import {
  HeartIcon, ChatBubbleLeftIcon, UserPlusIcon, UserGroupIcon,
  CalendarIcon, EnvelopeIcon, BellIcon, StarIcon, MicrophoneIcon,
} from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import type { NotificationType } from '../interfaces/notification.interfaces';

interface NotificationIconProps {
  avatarSrc?: string;
  actorName?: string;
  type: NotificationType;
}

export default function NotificationIcon({ avatarSrc, actorName, type }: NotificationIconProps) {
  const category = String(type ?? '');
  const Icon = category.includes('LIKE') ? HeartIcon :
    category.includes('FRIEND') || type === 'PAGE_FOLLOW' ? UserPlusIcon :
    category.includes('COMMENT') || category.includes('MENTION') ? ChatBubbleLeftIcon :
    category.includes('MESSAGE') ? EnvelopeIcon :
    category.includes('EVENT') ? CalendarIcon :
    category.includes('GROUP') ? UserGroupIcon :
    type === 'PAGE_RECOMMEND' ? StarIcon : type === 'PAGE_AUDITION' ? MicrophoneIcon : BellIcon;
  const initials = actorName?.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('') || 'Y';
  return (
    <div className="relative shrink-0 self-start" aria-hidden="true">
      <Avatar src={avatarSrc} initials={initials} className="h-12 w-12 text-neutral-700 dark:text-neutral-200" />
      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-800 ring-2 ring-white dark:bg-primary-900 dark:text-primary-300 dark:ring-neutral-900">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}
