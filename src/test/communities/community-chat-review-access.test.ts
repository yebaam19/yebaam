import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listCommunityChatReviews } from '@/features/chat-publico/actions/community-chat-review.actions'

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), from: vi.fn() }))
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({
  auth: { getUser: mocks.getUser }, rpc: mocks.rpc, from: mocks.from,
}) }))

const communityId = '11111111-1111-4111-8111-111111111111'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({ data: { user: { id: '22222222-2222-4222-8222-222222222222' } } })
  mocks.rpc.mockImplementation(async (name: string) => ({
    data: name === 'is_platform_admin', error: null,
  }))
  const query = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(),
    then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockReturnValue(query)
  mocks.from.mockReturnValue(query)
})

describe('community chat review staff access', () => {
  it('lets a verified platform admin read the RLS-scoped review inbox', async () => {
    expect(await listCommunityChatReviews(communityId, 'staff')).toEqual({
      ok: true, items: [], nextCursor: null,
    })
    expect(mocks.rpc).toHaveBeenCalledWith('is_platform_admin')
    expect(mocks.from).toHaveBeenCalledWith('community_chat_review_requests')
  })

  it('denies users without community moderation or platform admin rights', async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null })
    expect(await listCommunityChatReviews(communityId, 'staff'))
      .toMatchObject({ ok: false })
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
