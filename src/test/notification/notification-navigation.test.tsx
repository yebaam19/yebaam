// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NotificationItem from '@/features/notification/components/NotificationItem';
import { NotificationType } from '@/features/notification/interfaces/notification.interfaces';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'es' }));
vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/features/notification/hooks/useNotificationActions', () => ({ useNotificationActions: () => ({}) }));
vi.mock('@/features/notification/components/NotificationContent', () => ({ default: () => <p>Ana comentó</p> }));
vi.mock('@/features/notification/components/NotificationIcon', () => ({ default: () => null }));

describe('notification navigation', () => {
  it('navigates through the client router without waiting for a slow mark-read request', () => {
    const onRead = vi.fn(() => new Promise<void>(() => {}));
    render(<NotificationItem notification={{
      id: 'notification', userId: 'viewer', actor: { id: 'ana', username: 'ana', displayName: 'Ana' },
      type: NotificationType.POST_COMMENT, metadata: {}, message: 'comentó', isRead: false,
      createdAt: '2026-10-11T10:00:00Z', targetUrl: '/feed/post/example',
    }} onRead={onRead} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Ana comentó/ }));
    expect(onRead).toHaveBeenCalledWith('notification');
    expect(push).toHaveBeenCalledWith('/feed/post/example');
  });
});
