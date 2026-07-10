/**
 * NotificationIcon
 * 
 * Componente para mostrar el avatar con el badge del tipo de notificación
 */

import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowPathRoundedSquareIcon,
  UserPlusIcon,
  UserGroupIcon,
  CalendarIcon,
  EnvelopeIcon,
  BellIcon,
  StarIcon,
  HandThumbUpIcon,
  MicrophoneIcon,
} from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';
import type { NotificationType } from '../interfaces/notification.interfaces';

interface NotificationIconProps {
  avatarSrc?: string;
  type: NotificationType;
}

/**
 * Obtiene el icono según el tipo de notificación
 */
const getNotificationIcon = (type: NotificationType) => {
  const iconClass = 'h-4 w-4 text-white';
  
  switch (type) {
    case 'POST_LIKE':
    case 'COMMENT_LIKE':
      return <HeartIcon className={cn(iconClass, 'text-red-500')} />;
    
    case 'POST_COMMENT':
    case 'COMMENT_REPLY':
    case 'POST_MENTION':
    case 'COMMENT_MENTION':
      return <ChatBubbleLeftIcon className={cn(iconClass, 'text-blue-500')} />;
    
    case 'POST_SHARE':
      return <ArrowPathRoundedSquareIcon className={cn(iconClass, 'text-green-500')} />;
    
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED':
    case 'FRIEND_SUGGESTION':
      return <UserPlusIcon className={cn(iconClass, 'text-purple-500')} />;
    
    case 'GROUP_INVITE':
    case 'GROUP_POST':
    case 'GROUP_JOIN':
      return <UserGroupIcon className={cn(iconClass, 'text-orange-500')} />;
    
    case 'EVENT_INVITE':
    case 'EVENT_REMINDER':
      return <CalendarIcon className={cn(iconClass, 'text-pink-500')} />;
    
    case 'NEW_MESSAGE':
    case 'PAGE_MESSAGE':
      return <EnvelopeIcon className={cn(iconClass, 'text-indigo-500')} />;

    case 'PAGE_FOLLOW':
      return <UserPlusIcon className={cn(iconClass, 'text-teal-500')} />;

    case 'PAGE_RECOMMEND':
      return <StarIcon className={cn(iconClass, 'text-yellow-500')} />;

    case 'PAGE_LIKE':
      return <HandThumbUpIcon className={cn(iconClass, 'text-sky-500')} />;

    case 'PAGE_AUDITION':
      return <MicrophoneIcon className={cn(iconClass, 'text-violet-500')} />;

    case 'PAGE_EVENT':
      return <CalendarIcon className={cn(iconClass, 'text-pink-500')} />;

    default:
      return <BellIcon className={cn(iconClass, 'text-neutral-500')} />;
  }
};

/**
 * Obtiene el color de fondo del badge
 */
const getIconBackgroundColor = (type: NotificationType) => {
  switch (type) {
    case 'POST_LIKE':
    case 'COMMENT_LIKE':
      return 'bg-red-100 dark:bg-red-900/20';
    
    case 'POST_COMMENT':
    case 'COMMENT_REPLY':
    case 'POST_MENTION':
    case 'COMMENT_MENTION':
      return 'bg-blue-100 dark:bg-blue-900/20';
    
    case 'POST_SHARE':
      return 'bg-green-100 dark:bg-green-900/20';
    
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED':
    case 'FRIEND_SUGGESTION':
      return 'bg-purple-100 dark:bg-purple-900/20';
    
    case 'GROUP_INVITE':
    case 'GROUP_POST':
    case 'GROUP_JOIN':
      return 'bg-orange-100 dark:bg-orange-900/20';
    
    case 'EVENT_INVITE':
    case 'EVENT_REMINDER':
      return 'bg-pink-100 dark:bg-pink-900/20';
    
    case 'NEW_MESSAGE':
    case 'PAGE_MESSAGE':
      return 'bg-indigo-100 dark:bg-indigo-900/20';

    case 'PAGE_FOLLOW':
      return 'bg-teal-100 dark:bg-teal-900/20';

    case 'PAGE_RECOMMEND':
      return 'bg-yellow-100 dark:bg-yellow-900/20';

    case 'PAGE_LIKE':
      return 'bg-sky-100 dark:bg-sky-900/20';

    case 'PAGE_AUDITION':
      return 'bg-violet-100 dark:bg-violet-900/20';

    case 'PAGE_EVENT':
      return 'bg-pink-100 dark:bg-pink-900/20';

    default:
      return 'bg-neutral-100 dark:bg-neutral-800';
  }
};

export default function NotificationIcon({ avatarSrc, type }: NotificationIconProps) {
  return (
    <div className="relative shrink-0">
      <Avatar src={avatarSrc} className="h-12 w-12" />
      
      {/* Badge con icono del tipo de notificación */}
      <div
        className={cn(
          'absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full',
          getIconBackgroundColor(type),
          'ring-2 ring-white dark:ring-neutral-900'
        )}
      >
        {getNotificationIcon(type)}
      </div>
    </div>
  );
}
