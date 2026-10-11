import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import type { Notification } from '../interfaces/notification.interfaces';

interface NavigationProps {
  notification: Notification;
  isFriendRequest: boolean;
  onClick?: (notification: Notification) => void;
}

export const useNotificationNavigation = ({ notification, onClick }: NavigationProps) => {
  const router = useRouter();
  const handleClick = () => {
    if (onClick) { onClick(notification); return; }
    let target = notification.targetUrl;
    if (target?.startsWith('/profile/') || target?.startsWith('/feed/profile/')) {
      target = notification.actor.username ? `/${notification.actor.username}` :
        target.replace(/^\/(?:feed\/)?profile\//, '/');
    }
    if (!target && notification.actor.username) target = `/${notification.actor.username}`;
    // Notifications may only navigate within the app.
    if (target?.startsWith('/') && !target.startsWith('//') && !target.includes('\\')) router.push(target as Route);
  };
  return { handleClick };
};
