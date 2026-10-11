import { profileService } from '../services/profile.service'
import type { ProfileSlice, ProfileState } from './profile-state'

const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Map<string, T>()
  for (const item of items) seen.set(item.id, item)
  return Array.from(seen.values())
}

export const createProfilePagination: ProfileSlice<Pick<ProfileState,
  'fetchUserPosts' | 'loadMorePosts' | 'fetchUserPhotos' | 'loadMorePhotos' | 'fetchUserVideos' | 'loadMoreVideos'
>> = (set, get) => ({
      fetchUserPosts: async (userId: string, reset = false) => {
        // Auto-reset when the requested user differs from the cached one so we
        // don't bleed posts from a previously visited profile, and so React
        // StrictMode's double-invocation can't duplicate page-1 onto itself.
        const effectiveReset = reset || get().postsUserId !== userId
        set({ isLoadingPosts: true, error: null })
        try {
          const cursor = effectiveReset ? null : get().postsCursor
          const response = await profileService.getUserPosts(userId, cursor ?? undefined)

          const merged = effectiveReset
            ? response.items
            : dedupeById([...get().userPosts, ...response.items])

          set({
            userPosts: merged,
            postsUserId: userId,
            hasMorePosts: !!response.nextCursor,
            postsCursor: response.nextCursor,
            isLoadingPosts: false,
          })
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al cargar posts'
          set({ error: errorMsg, isLoadingPosts: false })
        }
      },

      loadMorePosts: async () => {
        const currentProfile = get().currentProfile
        if (!currentProfile || !get().hasMorePosts || get().isLoadingPosts) return
        await get().fetchUserPosts(currentProfile.userId)
      },

      // ========================================================================
      // API CALLS - Fotos
      // ========================================================================

      fetchUserPhotos: async (userId: string, reset = false) => {
        const effectiveReset = reset || get().photosUserId !== userId
        set({ isLoadingPhotos: true, error: null })
        try {
          const cursor = effectiveReset ? null : get().photosCursor
          const response = await profileService.getUserPhotos(userId, cursor ?? undefined)

          const merged = effectiveReset
            ? response.items
            : dedupeById([...get().userPhotos, ...response.items])

          set({
            userPhotos: merged,
            photosUserId: userId,
            hasMorePhotos: !!response.nextCursor,
            photosCursor: response.nextCursor,
            isLoadingPhotos: false,
          })
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al cargar fotos'
          set({ error: errorMsg, isLoadingPhotos: false })
        }
      },

      loadMorePhotos: async () => {
        const currentProfile = get().currentProfile
        if (!currentProfile || !get().hasMorePhotos || get().isLoadingPhotos) return
        await get().fetchUserPhotos(currentProfile.userId)
      },

      // ========================================================================
      // API CALLS - Videos
      // ========================================================================

      fetchUserVideos: async (userId: string, reset = false) => {
        const effectiveReset = reset || get().videosUserId !== userId
        set({ isLoadingVideos: true, error: null })
        try {
          const cursor = effectiveReset ? null : get().videosCursor
          const response = await profileService.getUserVideos(userId, cursor ?? undefined)

          const merged = effectiveReset
            ? response.items
            : dedupeById([...get().userVideos, ...response.items])

          set({
            userVideos: merged,
            videosUserId: userId,
            hasMoreVideos: !!response.nextCursor,
            videosCursor: response.nextCursor,
            isLoadingVideos: false,
          })
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al cargar videos'
          set({ error: errorMsg, isLoadingVideos: false })
        }
      },

      loadMoreVideos: async () => {
        const currentProfile = get().currentProfile
        if (!currentProfile || !get().hasMoreVideos || get().isLoadingVideos) return
        await get().fetchUserVideos(currentProfile.userId)
      },
})
