import { beforeEach, expect, it, vi } from 'vitest'
import { upsertCategory, upsertForum } from '@/features/foro/actions/admin/structure.actions'

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), insert: vi.fn(), update: vi.fn(), single: vi.fn(), eq: vi.fn(), admin: vi.fn(), refresh: vi.fn() }))
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({ auth: { getUser: mocks.getUser }, from: mocks.from }) }))
vi.mock('@/app/(app)/foro/server/roles.server', () => ({ isSpaceAdmin: mocks.admin }))
vi.mock('@/features/foro/actions/admin/_helpers', () => ({ slugify: (s: string) => s.toLowerCase(), revalidateSpaceBySlug: mocks.refresh }))
const spaceId = '11111111-1111-4111-8111-111111111111'
const otherSpace = '22222222-2222-4222-8222-222222222222'
const categoryId = '33333333-3333-4333-8333-333333333333'
const forumId = '44444444-4444-4444-8444-444444444444'
beforeEach(() => {
  vi.resetAllMocks()
  const query = { select: vi.fn(() => query), eq: mocks.eq, maybeSingle: mocks.single, insert: mocks.insert, update: mocks.update }
  mocks.from.mockReturnValue(query); mocks.eq.mockReturnValue(query); mocks.update.mockReturnValue(query)
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'admin' } }, error: null })
  mocks.admin.mockResolvedValue(true); mocks.insert.mockResolvedValue({ error: null })
  mocks.single.mockResolvedValue({ data: { id: categoryId, space_id: spaceId }, error: null })
})
it('allows General in separate cities without global slug collisions', async () => {
  await upsertCategory({ spaceId, name: 'General' })
  await upsertCategory({ spaceId: otherSpace, name: 'General' })
  expect(mocks.insert.mock.calls[0][0].slug).not.toBe(mocks.insert.mock.calls[1][0].slug)
})
it('preserves the slug on rename and scopes the update to the claimed space', async () => {
  expect((await upsertCategory({ spaceId, categoryId, name: 'Noticias' })).ok).toBe(true)
  expect(mocks.update.mock.calls[0][0]).not.toHaveProperty('slug')
  expect(mocks.eq).toHaveBeenCalledWith('space_id', spaceId)
})
it('requires verified caller and space administration before mutation', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null })
  expect((await upsertCategory({ spaceId, name: 'General' })).ok).toBe(false)
  expect(mocks.from).not.toHaveBeenCalled()
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'user' } }, error: null })
  mocks.admin.mockResolvedValue(false)
  expect((await upsertCategory({ spaceId, name: 'General' })).ok).toBe(false)
  expect(mocks.insert).not.toHaveBeenCalled()
})
it('rejects a category from another space and a forum as its own parent', async () => {
  mocks.single.mockResolvedValueOnce({ data: { space_id: otherSpace }, error: null })
  expect((await upsertForum({ spaceId, categoryId, name: 'General' })).ok).toBe(false)
  expect((await upsertForum({ spaceId, categoryId, forumId, parentForumId: forumId, name: 'General' })).ok).toBe(false)
  expect(mocks.insert).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled()
})
it('rejects blank names and zero-row updates', async () => {
  expect((await upsertCategory({ spaceId, name: ' ' })).ok).toBe(false)
  mocks.single.mockResolvedValue({ data: null, error: null })
  expect((await upsertCategory({ spaceId, categoryId, name: 'General' })).ok).toBe(false)
  expect(mocks.refresh).not.toHaveBeenCalled()
})
