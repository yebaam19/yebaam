import { describe, expect, it } from 'vitest';
import { mergeMessages } from '@/features/chat/lib/messageRows';
import type { ChatMessage } from '@/features/chat/types';

function message(id: string, createdAt: string, content = id): ChatMessage {
  return { id, createdAt, content, conversationId: 'conversation', senderId: 'sender', status: 'sent', media: null };
}

describe('chat history reconciliation', () => {
  it('keeps a realtime edit while history is loading and deduplicates repeated history rows', () => {
    const recent = message('new', '2026-10-11T12:01:00Z', 'edited live');
    const old = message('old', '2026-10-11T12:00:00Z');
    const previous = [recent];
    const result = mergeMessages(previous, [old, { ...recent, content: 'stale' }, old]);
    expect(result.map(({ id }) => id)).toEqual(['old', 'new']);
    expect(result[1].content).toBe('edited live');
    expect(previous).toEqual([recent]);
  });
});
