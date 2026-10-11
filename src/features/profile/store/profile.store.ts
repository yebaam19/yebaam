import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { UserProfile } from '../interfaces/profile.interfaces'
import { profileMapKey, putProfileInProfilesMap } from './profile-map-key'
import type { ProfileState, ProfilePost } from './profile-state'
import { createProfileActions } from './profile-actions'
import { createProfilePagination } from './profile-media-pagination'

export const useProfileStore = create<ProfileState>()(
  devtools(
    (set, get, api) => ({
      // Estado inicial
      currentProfile: null,
      profiles: new Map(),
      isLoading: false,
      error: null,

      userPosts: [],
      isLoadingPosts: false,
      hasMorePosts: true,
      postsCursor: null,
      postsUserId: null,

      userPhotos: [],
      isLoadingPhotos: false,
      hasMorePhotos: true,
      photosCursor: null,
      photosUserId: null,

      userVideos: [],
      isLoadingVideos: false,
      hasMoreVideos: true,
      videosCursor: null,
      videosUserId: null,

      ...createProfileActions(set, get, api),
      ...createProfilePagination(set, get, api),

      // ========================================================================
      // WEBSOCKET EVENTS
      // ========================================================================

      handleProfileUpdated: (profile: UserProfile) => {
        const profiles = new Map(get().profiles)
        putProfileInProfilesMap(profiles, profile)

        const currentProfile = get().currentProfile
        if (
          currentProfile &&
          profileMapKey(currentProfile.username) === profileMapKey(profile.username)
        ) {
          set({ currentProfile: profile, profiles })
        } else {
          set({ profiles })
        }
      },

      handlePostAdded: (post: ProfilePost) => {
        const userPosts = [post, ...get().userPosts]
        set({ userPosts })
      },

      handlePostRemoved: (postId: string) => {
        const userPosts = get().userPosts.filter((p) => p.id !== postId)
        set({ userPosts })
      },

      // ========================================================================
      // UTILIDADES
      // ========================================================================

      clearError: () => set({ error: null }),

      reset: () =>
        set({
          currentProfile: null,
          userPosts: [],
          userPhotos: [],
          userVideos: [],
          isLoading: false,
          isLoadingPosts: false,
          isLoadingPhotos: false,
          isLoadingVideos: false,
          error: null,
          hasMorePosts: true,
          hasMorePhotos: true,
          hasMoreVideos: true,
          postsCursor: null,
          photosCursor: null,
          videosCursor: null,
          postsUserId: null,
          photosUserId: null,
          videosUserId: null,
        }),
    }),
    { name: 'ProfileStore' }
  )
)
