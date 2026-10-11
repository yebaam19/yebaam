import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/conversations/[id]/messages/route';

const mocks = vi.hoisted(() => ({
  query: vi.fn(), insert: vi.fn(), eq: vi.fn(), from: vi.fn(),
  user: vi.fn(), token: vi.fn(), encrypt: vi.fn(),
}));
vi.mock('@/utils/supabase/server', () => ({
  getServerAccessToken: mocks.token,
  getServerClient: async () => ({ from: mocks.from, auth: { getUser: mocks.user } }),
}));
vi.mock('@/lib/server/chat-crypto', () => ({
  encryptChatContent: mocks.encrypt,
  decryptChatContent: (text: string) => text.replace('encrypted:', ''),
  isPrivateConversation: () => true,
}));
const id = 'fa13d443-e5d8-4271-912c-c8ffbc1a2cde';
const row = { id, conversation_id: 'room', sender_id: 'me', content: 'encrypted:hello', status: 'sent' };
function request(body: unknown = { content: 'hello', clientMessageId: id }) {
  return POST(new NextRequest('http://localhost/api/conversations/room/messages', {
    method: 'POST', body: JSON.stringify(body),
  }), { params: Promise.resolve({ id: 'room' }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  const chain = { select: () => chain, eq: mocks.eq, insert: mocks.insert, maybeSingle: mocks.query };
  mocks.from.mockReturnValue(chain);
  mocks.eq.mockReturnValue(chain);
  mocks.insert.mockReturnValue(chain);
  mocks.token.mockResolvedValue('token');
  mocks.user.mockResolvedValue({ data: { user: { id: 'me' } } });
  mocks.encrypt.mockImplementation((text: string) => `encrypted:${text}`);
});
describe('idempotent message sends', () => {
  it('inserts with the client UUID, encrypts and avoids a redundant conversation update', async () => {
    mocks.query.mockResolvedValueOnce({ data: { id: 'room', club_id: null } })
      .mockResolvedValueOnce({ data: row });
    const response = await request();
    expect(response.status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ id, sender_id: 'me', content: 'encrypted:hello' }));
    expect(mocks.from.mock.calls.map(([table]) => table)).toEqual(['conversations', 'messages']);
    expect((await response.json()).data.content).toBe('hello');
  });
  it('returns the existing owned row after a lost acknowledgement without writing again', async () => {
    mocks.query.mockResolvedValueOnce({ data: { id: 'room' } })
      .mockResolvedValueOnce({ error: { code: '23505' } }).mockResolvedValueOnce({ data: row });
    const response = await request();
    expect(response.status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.eq).toHaveBeenCalledWith('sender_id', 'me');
    expect(mocks.eq).toHaveBeenCalledWith('conversation_id', 'room');
    expect((await response.json()).data.id).toBe(id);
  });
  it('never exposes a conflicting id owned by another sender or conversation', async () => {
    mocks.query.mockResolvedValueOnce({ data: { id: 'room' } })
      .mockResolvedValueOnce({ error: { code: '23505' } }).mockResolvedValueOnce({ data: null });
    expect((await request()).status).toBe(409);
  });
  it('verifies the caller even with an existing session token', async () => {
    mocks.user.mockResolvedValue({ data: { user: null } });
    expect((await request()).status).toBe(401);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('rejects non-members before insertion or idempotency lookup', async () => {
    mocks.query.mockResolvedValue({ data: null });
    expect((await request()).status).toBe(403);
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it.each([{ content: 'hello', clientMessageId: 'invalid' }, { content: 42 }])('rejects malformed input', async (body) => {
    expect((await request(body)).status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
