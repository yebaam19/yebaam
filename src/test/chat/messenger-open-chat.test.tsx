import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import MessengerDropdown from '@/components/Header/MessengerDropdown';
import { useChatStore } from '@/features/chat/store/chat.store';
import { ConversationType } from '@/features/chat/types';

const { push, conversations } = vi.hoisted(() => ({
  push: vi.fn(),
  conversations: [
    { id: 'direct', type: 'DIRECT', participantIds: ['viewer', 'peer'], name: 'Test User', updatedAt: '2026-10-11', unreadCount: 0 },
    { id: 'group', type: 'GROUP', participantIds: ['viewer', 'peer'], name: 'Our group', updatedAt: '2026-10-11', unreadCount: 0 },
  ],
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/components/chat/NewMessageDialog', () => ({ default: () => null }));
vi.mock('@/ui/Avatar', () => ({ default: () => null }));
vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: create(() => ({ user: { id: 'viewer' } })) }));
vi.mock('@/features/chat/hooks/useChat', () => ({ useChat: () => ({ conversations, totalUnreadCount: 0 }) }));
vi.mock('@/features/chat/services/chat.service', () => ({ chatService: {} }));
vi.mock('@/features/presence/store/presence.store', () => ({ usePresenceStore: create(() => ({ onlineUserIds: new Set() })) }));

beforeEach(() => {
  vi.clearAllMocks();
  conversations[0].type = ConversationType.DIRECT;
  conversations[1].type = ConversationType.GROUP;
  useChatStore.setState({ openBubbles: [] });
});

it.each([['Test User', 'peer', 'direct'], ['Our group', 'group', 'group']])(
  'opens %s over the current page and closes the inbox', async (name, contactId, conversationId) => {
    render(<MessengerDropdown />);
    fireEvent.click(screen.getByRole('button', { name: 'messages' }));
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(name) }));
    expect(useChatStore.getState().openBubbles).toEqual([
      expect.objectContaining({ contactId, conversationId, contactName: name }),
    ]);
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'messages' })).toHaveAttribute('aria-expanded', 'false');
  },
);

it('brings an existing chat to the front without duplicating it', () => {
  const open = useChatStore.getState().openBubble;
  const contact = { contactId: 'peer', contactName: 'Test User', contactAvatar: '', isOnline: false };
  open(contact);
  open({ ...contact, contactId: 'second' });
  open(contact);
  expect(useChatStore.getState().openBubbles.map((bubble) => bubble.contactId)).toEqual(['second', 'peer']);
  expect(useChatStore.getState().openBubbles[1].openRequest).toBe(1);
});
