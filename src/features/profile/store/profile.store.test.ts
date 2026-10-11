import { beforeEach, expect, it, vi } from 'vitest'
import { useProfileStore } from './profile.store'
import type { UserProfile } from '../interfaces/profile.interfaces'

const service = vi.hoisted(() => ({ getUserPosts: vi.fn(), getProfileByUsername: vi.fn() }))
vi.mock('../services/profile.service', () => ({ profileService: service }))

beforeEach(() => {
  vi.clearAllMocks()
  useProfileStore.getState().reset()
  useProfileStore.setState({ profiles: new Map() })
})

it('appends cursor pages without duplicating posts and resets for a different profile', async () => {
  service.getUserPosts
    .mockResolvedValueOnce({ items: [{ id: 'a' }], nextCursor: 'cursor-a' })
    .mockResolvedValueOnce({ items: [{ id: 'a' }, { id: 'b' }], nextCursor: null })
    .mockResolvedValueOnce({ items: [{ id: 'c' }], nextCursor: null })

  await useProfileStore.getState().fetchUserPosts('first')
  await useProfileStore.getState().fetchUserPosts('first')
  expect(service.getUserPosts).toHaveBeenNthCalledWith(2, 'first', 'cursor-a')
  expect(useProfileStore.getState().userPosts.map(post => post.id)).toEqual(['a', 'b'])

  await useProfileStore.getState().fetchUserPosts('second')
  expect(service.getUserPosts).toHaveBeenNthCalledWith(3, 'second', undefined)
  expect(useProfileStore.getState().userPosts.map(post => post.id)).toEqual(['c'])
})

it('reuses a loaded profile through canonical username keys', async () => {
  const profile = { userId: 'first', username: 'First' } as UserProfile
  service.getProfileByUsername.mockResolvedValue(profile)
  await useProfileStore.getState().fetchProfileByUsername('First')
  await useProfileStore.getState().fetchProfileByUsername(' first ')
  expect(service.getProfileByUsername).toHaveBeenCalledTimes(1)
  expect(useProfileStore.getState().currentProfile).toBe(profile)
})
