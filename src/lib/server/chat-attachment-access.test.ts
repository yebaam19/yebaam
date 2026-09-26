import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerClient } from '@/utils/supabase/server';
import { authorizeChatAttachment, hasAllowedChatAttachmentKey } from './chat-attachment-access';

vi.mock('@/utils/supabase/server', () => ({ getServerClient: vi.fn() }));

function query(data: unknown) {
  const q = {
    select: vi.fn(),
    eq: vi.fn(),
    contains: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
  q.select.mockReturnValue(q);
  q.eq.mockReturnValue(q);
  q.contains.mockReturnValue(q);
  q.limit.mockReturnValue(q);
  return q;
}

describe('chat attachment authorization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not sign a key that has no live message in the requested conversation', async () => {
    const membership = query({ conversation_id: 'conversation-a' });
    const attachment = query(null);
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'viewer' } } }) },
      from: vi.fn((table: string) => table === 'messages' ? attachment : membership),
    };
    vi.mocked(getServerClient).mockResolvedValue(client as never);

    expect(await authorizeChatAttachment('conversation-a', 'chat-audio/2026/foreign.webm', 'audio'))
      .toEqual({ status: 404, error: 'Attachment not found' });
    expect(attachment.eq).toHaveBeenCalledWith('conversation_id', 'conversation-a');
    expect(attachment.eq).toHaveBeenCalledWith('is_deleted', false);
    expect(attachment.contains).toHaveBeenCalledWith('media', {
      type: 'audio', r2_key: 'chat-audio/2026/foreign.webm',
    });
  });

  it('accepts a member reading a matching legacy attachment', async () => {
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'viewer' } } }) },
      from: vi.fn((table: string) => table === 'messages'
        ? query({ id: 'message', sender_id: 'sender' }) : query({ conversation_id: 'conversation-a' })),
    };
    vi.mocked(getServerClient).mockResolvedValue(client as never);
    expect(await authorizeChatAttachment('conversation-a', 'chat-files/2026/old.pdf', 'file'))
      .toBeNull();
  });

  it('denies a nonparticipant even when the attachment key matches a message', async () => {
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'outsider' } } }) },
      from: vi.fn((table: string) => table === 'messages'
        ? query({ id: 'message', sender_id: 'sender' }) : query(null)),
    };
    vi.mocked(getServerClient).mockResolvedValue(client as never);
    expect(await authorizeChatAttachment('conversation-a', 'chat-files/2026/old.pdf', 'file'))
      .toEqual({ status: 403, error: 'Not a participant in this conversation' });
  });

  it('denies a copied uploader-scoped key despite a forged message reference', async () => {
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'viewer' } } }) },
      from: vi.fn((table: string) => table === 'messages'
        ? query({ id: 'forged', sender_id: 'attacker' }) : query({ conversation_id: 'conversation-a' })),
    };
    vi.mocked(getServerClient).mockResolvedValue(client as never);
    expect(await authorizeChatAttachment('conversation-a', 'chat-files/victim/2026/x.pdf', 'file'))
      .toEqual({ status: 403, error: 'Attachment owner mismatch' });
  });

  it('rejects copied and legacy keys in new messages', () => {
    expect(hasAllowedChatAttachmentKey({ type: 'audio', r2_key: 'chat-audio/other/2026/x.webm' }, 'viewer'))
      .toBe(false);
    expect(hasAllowedChatAttachmentKey({ type: 'file', r2_key: 'chat-files/2026/old.pdf' }, 'viewer'))
      .toBe(false);
    expect(hasAllowedChatAttachmentKey({ type: 'file', r2_key: 'chat-files/viewer/2026/new.pdf' }, 'viewer'))
      .toBe(true);
    expect(hasAllowedChatAttachmentKey(null, 'viewer')).toBe(true);
  });
});
