import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendChatMessage } from '@/features/chat-publico/actions/chat-publico.actions'

const mocks = vi.hoisted(() => ({
  identity: vi.fn(),
  getUser: vi.fn(),
  topic: vi.fn(),
  visibleTopic: vi.fn(),
  serviceInsert: vi.fn(),
  sessionInsert: vi.fn(),
  restriction: vi.fn(),
}))

vi.mock('@/features/chat-publico/lib/identity', () => ({ getRoomIdentity: mocks.identity }))
vi.mock('@/features/chat-publico/lib/session', () => ({ hashSessionToken: () => 'session-hash' }))
vi.mock('@/features/chat-publico/lib/permissions', () => ({ capabilitiesFor: () => ({ canChat: true }) }))
vi.mock('@/features/chat-publico/server/community-chat-restrictions.server', () => ({ getActiveCommunityChatRestriction: mocks.restriction }))
vi.mock('@/utils/supabase/server', () => ({
  getServiceClient: async () => ({
    from: (table: string) => table === 'public_chat_topics'
      ? { select: () => ({ eq: () => ({ maybeSingle: mocks.topic }) }) }
      : {
          select: () => ({ eq: () => ({ gte: () => ({ order: () => ({ limit: async () => ({ data: [] }) }) }) }) }),
          insert: mocks.serviceInsert,
        },
  }),
  getServerClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: (table: string) => table === 'public_chat_topics'
      ? { select: () => ({ eq: () => ({ maybeSingle: mocks.visibleTopic }) }) }
      : { insert: mocks.sessionInsert },
  }),
}))

const userId = '11111111-1111-4111-8111-111111111111'
const roomId = '22222222-2222-4222-8222-222222222222'
const parentId = '33333333-3333-4333-8333-333333333333'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.topic.mockResolvedValue({ data: { owner_type: 'community', owner_id: '44444444-4444-4444-8444-444444444444' }, error: null })
  mocks.visibleTopic.mockResolvedValue({ data: { id: roomId }, error: null })
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } } })
  mocks.sessionInsert.mockReturnValue({ select: () => ({ maybeSingle: async () => ({ data: { id: 'message-id' }, error: null }) }) })
  mocks.restriction.mockResolvedValue(null)
})

describe('community chat writes', () => {
  it('rejects a guest identity even when an old guest session exists', async () => {
    mocks.identity.mockResolvedValue({ kind: 'guest', nickname: 'visitor', sessionToken: 'token' })
    expect(await sendChatMessage(roomId, 'Hola')).toMatchObject({ ok: false, error: 'unauthorized' })
    expect(mocks.serviceInsert).not.toHaveBeenCalled()
    expect(mocks.sessionInsert).not.toHaveBeenCalled()
  })

  it('writes through the verified user session so RLS checks the community audience', async () => {
    mocks.identity.mockResolvedValue({ kind: 'profile', userId, displayName: 'Miembro', avatarUrl: null, sessionToken: 'token' })
    expect(await sendChatMessage(roomId, 'Hola')).toMatchObject({ ok: true, messageId: 'message-id' })
    expect(mocks.sessionInsert).toHaveBeenCalledWith(expect.objectContaining({ topic_id: roomId, sender_id: userId }))
    expect(mocks.serviceInsert).not.toHaveBeenCalled()
  })

  it('rejects a revoked community audience before inserting', async () => {
    mocks.identity.mockResolvedValue({ kind: 'profile', userId, displayName: 'Miembro', avatarUrl: null, sessionToken: 'token' })
    mocks.visibleTopic.mockResolvedValue({ data: null, error: null })
    expect(await sendChatMessage(roomId, 'Hola')).toMatchObject({ ok: false, error: 'unauthorized' })
    expect(mocks.sessionInsert).not.toHaveBeenCalled()
  })

  it('returns the active sanction without attempting a message write', async () => {
    mocks.identity.mockResolvedValue({ kind: 'profile', userId, displayName: 'Miembro', avatarUrl: null, sessionToken: 'token' })
    mocks.restriction.mockResolvedValue({ kind: 'suspend', reason: 'Moderation decision', expires_at: '2099-01-01T00:00:00Z' })
    expect(await sendChatMessage(roomId, 'Hola')).toMatchObject({ ok: false, error: 'restricted' })
    expect(mocks.sessionInsert).not.toHaveBeenCalled()
  })

  it('passes a reply parent through the session-bound write', async () => {
    mocks.identity.mockResolvedValue({ kind: 'profile', userId, displayName: 'Miembro', avatarUrl: null, sessionToken: 'token' })
    expect(await sendChatMessage(roomId, 'Respuesta', parentId)).toMatchObject({ ok: true })
    expect(mocks.sessionInsert).toHaveBeenCalledWith(expect.objectContaining({ parent_message_id: parentId }))
  })

  it('rejects a malformed parent before writing', async () => {
    expect(await sendChatMessage(roomId, 'Respuesta', 'not-a-uuid')).toMatchObject({ ok: false, error: 'invalid' })
    expect(mocks.sessionInsert).not.toHaveBeenCalled()
  })
})
