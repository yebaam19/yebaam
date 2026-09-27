import { describe, expect, it, vi } from 'vitest';
import { loadConversationList } from './listConversations';

function query<T>(result: T) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    then: (resolve: (value: T) => unknown) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

describe('loadConversationList', () => {
  it('uses one bounded embedded message read and preserves empty conversations', async () => {
    const myParts = query({ data: [
      { conversation_id: 'conv-1', last_read_at: null },
      { conversation_id: 'conv-2', last_read_at: null },
    ], error: null });
    const conversations = query({
      data: [{
        id: 'conv-1', type: 'group', name: 'Club chat', avatar: null,
        created_by: 'viewer', club_id: 'club-1', metadata: null,
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
        messages: [{
          id: 'msg-1', conversation_id: 'conv-1', sender_id: 'viewer',
          content: 'Hello', media: null, created_at: '2026-01-02T00:00:00Z',
        }],
      }, {
        id: 'conv-2', type: 'group', name: 'Empty chat', avatar: null,
        created_by: 'viewer', club_id: 'club-1', metadata: null,
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
        messages: [],
      }],
      error: null,
    });
    const allParts = query({
      data: [
        { conversation_id: 'conv-1', user_id: 'viewer', last_read_at: null },
        { conversation_id: 'conv-2', user_id: 'viewer', last_read_at: null },
      ],
      error: null,
    });
    const from = vi.fn()
      .mockReturnValueOnce(myParts)
      .mockReturnValueOnce(conversations)
      .mockReturnValueOnce(allParts);

    const result = await loadConversationList(
      { from } as unknown as Parameters<typeof loadConversationList>[0],
      'viewer',
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[0].lastMessage?.content).toBe('Hello');
    expect(result.data[1].lastMessage).toBeNull();
    expect(from.mock.calls.map(([table]) => table)).toEqual([
      'conversation_participants', 'conversations', 'conversation_participants',
    ]);
    expect(conversations.select).toHaveBeenCalledWith(expect.stringContaining('messages('));
    expect(conversations.limit).toHaveBeenCalledWith(1, { referencedTable: 'messages' });
  });
});
