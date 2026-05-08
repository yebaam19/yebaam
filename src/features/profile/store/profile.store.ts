/**
 * Profile Store
 *
 * Store global de Zustand para gestionar perfiles de usuario
 * Maneja el estado de perfiles, estadísticas y media
 */

import { toast } from 'sonner'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  UpdateInterestsDTO,
  UpdatePersonalInfoDTO,
  UpdateProfileDTO,
  UpdateSocialLinksDTO,
  UserProfile,
} from '../interfaces/profile.interfaces'
import { profileService } from '../services/profile.service'
import { profileMapKey, putProfileInProfilesMap } from './profile-map-key'

// Last-write-wins dedupe by `id`. Order preserved so cursor-paginated lists
// still render newest-first when the backend returns a duplicate row from a
// previous page on a "load more" call.
const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Map<string, T>()
  for (const item of items) seen.set(item.id, item)
  return Array.from(seen.values())
}

// ============================================================================
// TYPES
// ============================================================================

interface ProfileState {
  // Estado principal
  currentProfile: UserProfile | null
  profiles: Map<string, UserProfile> // Cache de perfiles por username
  isLoading: boolean
  error: string | null

  // Posts del usuario
  userPosts: any[]
  isLoadingPosts: boolean
  hasMorePosts: boolean
  postsCursor: string | null
  postsUserId: string | null

  // Fotos del usuario
  userPhotos: any[]
  isLoadingPhotos: boolean
  hasMorePhotos: boolean
  photosCursor: string | null
  photosUserId: string | null

  // Videos del usuario
  userVideos: any[]
  isLoadingVideos: boolean
  hasMoreVideos: boolean
  videosCursor: string | null
  videosUserId: string | null

  // Acciones - API Calls
  fetchProfileByUsername: (username: string) => Promise<void>
  fetchMyProfile: () => Promise<void>
  updateProfile: (data: UpdateProfileDTO) => Promise<void>
  updatePersonalInfo: (data: UpdatePersonalInfoDTO) => Promise<void>
  updateSocialLinks: (data: UpdateSocialLinksDTO) => Promise<void>
  updateInterests: (data: UpdateInterestsDTO) => Promise<void>
  uploadImage: (file: File, type: 'avatar' | 'cover' | 'idDocument') => Promise<string>

  // Posts
  fetchUserPosts: (userId: string, reset?: boolean) => Promise<void>
  loadMorePosts: () => Promise<void>

  // Fotos
  fetchUserPhotos: (userId: string, reset?: boolean) => Promise<void>
  loadMorePhotos: () => Promise<void>

  // Videos
  fetchUserVideos: (userId: string, reset?: boolean) => Promise<void>
  loadMoreVideos: () => Promise<void>

  // WebSocket events
  handleProfileUpdated: (profile: UserProfile) => void
  handlePostAdded: (post: any) => void
  handlePostRemoved: (postId: string) => void

  // Utilidades
  clearError: () => void
  reset: () => void
}

// ============================================================================
// STORE
// ============================================================================

export const useProfileStore = create<ProfileState>()(
  devtools(
    (set, get) => ({
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

      // ========================================================================
      // API CALLS - Profile
      // ========================================================================

      /**
       * Obtener perfil por username
       */
      fetchProfileByUsername: async (username: string) => {
        set({ isLoading: true, error: null })
        try {
          // Verificar cache primero
          const cachedProfile = get().profiles.get(profileMapKey(username))
          if (cachedProfile) {
            set({ currentProfile: cachedProfile, isLoading: false })
            return
          }

          const profile = await profileService.getProfileByUsername(username)

          if (!profile) {
            set({ currentProfile: null, isLoading: false })
            return
          }

          const profiles = new Map(get().profiles)
          putProfileInProfilesMap(profiles, profile, username)

          set({
            currentProfile: profile,
            profiles,
            isLoading: false,
          })
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al cargar perfil'
          set({ error: errorMsg, isLoading: false })
          toast.error(errorMsg)
        }
      },

      /**
       * Obtener mi perfil
       */
      fetchMyProfile: async () => {
        set({ isLoading: true, error: null })
        try {
          const profile = await profileService.getMyProfile()

          const profiles = new Map(get().profiles)
          putProfileInProfilesMap(profiles, profile)

          set({
            currentProfile: profile,
            profiles,
            isLoading: false,
          })
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al cargar perfil'
          set({ error: errorMsg, isLoading: false })
          toast.error(errorMsg)
        }
      },

      /**
       * Actualizar perfil básico
       */
      updateProfile: async (data: UpdateProfileDTO) => {
        set({ isLoading: true, error: null })
        try {
          const updatedProfile = await profileService.updateProfile(data)

          // Actualizar cache
          const profiles = new Map(get().profiles)
          putProfileInProfilesMap(profiles, updatedProfile)

          set({
            currentProfile: updatedProfile,
            profiles,
            isLoading: false,
          })

          toast.success('Perfil actualizado correctamente')
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al actualizar perfil'
          set({ error: errorMsg, isLoading: false })
          toast.error(errorMsg)
          throw error
        }
      },

      /**
       * Actualizar información personal
       */
      updatePersonalInfo: async (data: UpdatePersonalInfoDTO) => {
        set({ isLoading: true, error: null })
        try {
          const updatedProfile = await profileService.updatePersonalInfo(data)

          const profiles = new Map(get().profiles)
          putProfileInProfilesMap(profiles, updatedProfile)

          set({
            currentProfile: updatedProfile,
            profiles,
            isLoading: false,
          })

          toast.success('Información personal actualizada')
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al actualizar información personal'
          set({ error: errorMsg, isLoading: false })
          toast.error(errorMsg)
          throw error
        }
      },

      /**
       * Actualizar enlaces sociales
       */
      updateSocialLinks: async (data: UpdateSocialLinksDTO) => {
        set({ isLoading: true, error: null })
        try {
          const updatedProfile = await profileService.updateSocialLinks(data)

          const profiles = new Map(get().profiles)
          putProfileInProfilesMap(profiles, updatedProfile)

          set({
            currentProfile: updatedProfile,
            profiles,
            isLoading: false,
          })

          toast.success('Enlaces sociales actualizados')
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al actualizar enlaces sociales'
          set({ error: errorMsg, isLoading: false })
          toast.error(errorMsg)
          throw error
        }
      },

      /**
       * Actualizar intereses
       */
      updateInterests: async (data: UpdateInterestsDTO) => {
        set({ isLoading: true, error: null })
        try {
          const updatedProfile = await profileService.updateInterests(data)

          const profiles = new Map(get().profiles)
          putProfileInProfilesMap(profiles, updatedProfile)

          set({
            currentProfile: updatedProfile,
            profiles,
            isLoading: false,
          })

          toast.success('Intereses actualizados')
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al actualizar intereses'
          set({ error: errorMsg, isLoading: false })
          toast.error(errorMsg)
          throw error
        }
      },

      /**
       * Subir imagen (avatar, cover o idDocument)
       */
      uploadImage: async (file: File, type: 'avatar' | 'cover' | 'idDocument') => {
        try {
          const result = await profileService.uploadImage(file, type)
          return result.url
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al subir imagen'
          toast.error(errorMsg)
          throw error
        }
      },

      // ========================================================================
      // API CALLS - Posts
      // ========================================================================

      /**
       * Obtener posts del usuario
       */
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

      handlePostAdded: (post: any) => {
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
