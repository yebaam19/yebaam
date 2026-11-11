import { beforeEach, expect, it, vi } from 'vitest'
import { createTopic } from '@/features/foro/actions/topics.actions'

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), path: vi.fn(), refresh: vi.fn() }))
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc }) }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.refresh }))
vi.mock('@/features/foro/actions/_helpers', () => ({ lookupForumPath: mocks.path, slugify: () => 'tema' }))
const input = { forumId: '11111111-1111-4111-8111-111111111111', requestId: '22222222-2222-4222-8222-222222222222', title: 'Tema', content: 'Mensaje' }
beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'author' } }, error: null })
  mocks.path.mockResolvedValue({ space_slug: 'city-test', forum_slug: 'general' })
  mocks.rpc.mockResolvedValue({ data: { id: input.requestId, slug: 'tema-id' }, error: null })
})
it('writes topic and first post through one caller-bound RPC with stable retry id', async () => {
  expect(await createTopic(input)).toEqual({ ok: true, spaceSlug: 'city-test', forumSlug: 'general', topicSlug: 'tema-id' })
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('create_forum_topic_with_post', {
    p_topic_id: input.requestId, p_forum_id: input.forumId, p_title: 'Tema', p_slug: `tema-${input.requestId}`, p_content: 'Mensaje',
  })
})
it('does not publish or revalidate on database failure', async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { message: 'post denied' } })
  expect((await createTopic(input)).ok).toBe(false)
  expect(mocks.refresh).not.toHaveBeenCalled()
})
it('rejects unauthenticated callers, invalid ids and excessive titles', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
  expect((await createTopic(input)).ok).toBe(false)
  expect((await createTopic({ ...input, requestId: 'bad' })).ok).toBe(false)
  expect((await createTopic({ ...input, title: 'a'.repeat(201) })).ok).toBe(false)
  expect(mocks.rpc).not.toHaveBeenCalled()
})
