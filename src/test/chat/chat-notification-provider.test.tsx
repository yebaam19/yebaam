import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ChatNotificationProvider,
  useChatNotifications,
} from '@/features/chat/context/chat-notification.context';

vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: (select: (state: { user: null }) => unknown) => select({ user: null }),
}));
vi.mock('@/components/chat/MessageNotificationsContainer', () => ({
  default: () => <div data-testid="notification-container" />,
}));

const requestPermission = vi.fn(async () => 'default' as NotificationPermission);

function ConversationState({ label }: { label: string }) {
  const { openConversations, markConversationAsOpen } = useChatNotifications();
  return <button onClick={() => markConversationAsOpen('conversation')}>
    {label}: {openConversations.has('conversation') ? 'open' : 'closed'}
  </button>;
}

beforeEach(() => {
  requestPermission.mockClear();
  vi.stubGlobal('Notification', { permission: 'default', requestPermission });
});

afterEach(() => vi.unstubAllGlobals());

describe('ChatNotificationProvider ownership', () => {
  it('mounts one notification owner and requests permission once across nested layouts', async () => {
    await act(async () => render(
      <ChatNotificationProvider>
        <ChatNotificationProvider><ConversationState label="page" /></ChatNotificationProvider>
      </ChatNotificationProvider>,
    ));
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId('notification-container')).toHaveLength(1);
  });

  it('shares open conversations between page content and the outer app shell', async () => {
    await act(async () => render(
      <ChatNotificationProvider>
        <ConversationState label="shell" />
        <ChatNotificationProvider><ConversationState label="page" /></ChatNotificationProvider>
      </ChatNotificationProvider>,
    ));
    fireEvent.click(screen.getByRole('button', { name: 'page: closed' }));
    expect(screen.getByRole('button', { name: 'shell: open' })).toBeInTheDocument();
  });

  it('still provides notification state for a standalone visitor layout', async () => {
    await act(async () => render(
      <ChatNotificationProvider><ConversationState label="visitor" /></ChatNotificationProvider>,
    ));
    fireEvent.click(screen.getByRole('button', { name: 'visitor: closed' }));
    expect(screen.getByRole('button', { name: 'visitor: open' })).toBeInTheDocument();
    expect(screen.getAllByTestId('notification-container')).toHaveLength(1);
  });
});
