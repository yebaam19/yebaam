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
  postsPage: number

  // Fotos del usuario
  userPhotos: any[]
  isLoadingPhotos: boolean
  hasMorePhotos: boolean
  photosPage: number

  // Videos del usuario
  userVideos: any[]
  isLoadingVideos: boolean
  hasMoreVideos: boolean
  videosPage: number

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
      postsPage: 1,

      userPhotos: [],
      isLoadingPhotos: false,
      hasMorePhotos: true,
      photosPage: 1,

      userVideos: [],
      isLoadingVideos: false,
      hasMoreVideos: true,
      videosPage: 1,

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
          const cachedProfile = get().profiles.get(username)
          if (cachedProfile) {
            set({ currentProfile: cachedProfile, isLoading: false })
            return
          }

          const profile = await profileService.getProfileByUsername(username)

          // Actualizar cache
          const profiles = new Map(get().profiles)
          profiles.set(username, profile)

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

          // Actualizar cache
          const profiles = new Map(get().profiles)
          profiles.set(profile.username, profile)

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
          profiles.set(updatedProfile.username, updatedProfile)

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
          profiles.set(updatedProfile.username, updatedProfile)

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
          profiles.set(updatedProfile.username, updatedProfile)

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
          profiles.set(updatedProfile.username, updatedProfile)

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
        set({ isLoadingPosts: true, error: null })
        try {
          const page = reset ? 1 : get().postsPage
          const response = await profileService.getUserPosts(userId, page.toString())

          const newPosts = reset ? response.data : [...get().userPosts, ...response.data]

          set({
            userPosts: newPosts,
            hasMorePosts: !!response.nextCursor,
            postsPage: page,
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

        set({ postsPage: get().postsPage + 1 })
        await get().fetchUserPosts(currentProfile.userId)
      },

      // ========================================================================
      // API CALLS - Fotos
      // ========================================================================

      fetchUserPhotos: async (userId: string, reset = false) => {
        set({ isLoadingPhotos: true, error: null })
        try {
          const page = reset ? 1 : get().photosPage
          const response = await profileService.getUserPhotos(userId, page.toString())

          const newPhotos = reset ? response.data : [...get().userPhotos, ...response.data]

          set({
            userPhotos: newPhotos,
            hasMorePhotos: !!response.nextCursor,
            photosPage: page,
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

        set({ photosPage: get().photosPage + 1 })
        await get().fetchUserPhotos(currentProfile.userId)
      },

      // ========================================================================
      // API CALLS - Videos
      // ========================================================================

      fetchUserVideos: async (userId: string, reset = false) => {
        set({ isLoadingVideos: true, error: null })
        try {
          const page = reset ? 1 : get().videosPage
          const response = await profileService.getUserVideos(userId, page.toString())

          const newVideos = reset ? response.data : [...get().userVideos, ...response.data]

          set({
            userVideos: newVideos,
            hasMoreVideos: !!response.nextCursor,
            videosPage: page,
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

        set({ videosPage: get().videosPage + 1 })
        await get().fetchUserVideos(currentProfile.userId)
      },

      // ========================================================================
      // WEBSOCKET EVENTS
      // ========================================================================

      handleProfileUpdated: (profile: UserProfile) => {
        const profiles = new Map(get().profiles)
        profiles.set(profile.username, profile)

        const currentProfile = get().currentProfile
        if (currentProfile && currentProfile.username === profile.username) {
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
          postsPage: 1,
          photosPage: 1,
          videosPage: 1,
        }),
    }),
    { name: 'ProfileStore' }
  )
)
