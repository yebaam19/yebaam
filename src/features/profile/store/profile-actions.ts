import { toast } from 'sonner'
import type {
  UpdateInterestsDTO,
  UpdatePersonalInfoDTO,
  UpdateProfileDTO,
  UpdateSocialLinksDTO,
} from '../interfaces/profile.interfaces'
import { profileService } from '../services/profile.service'
import { profileMapKey, putProfileInProfilesMap } from './profile-map-key'

import type { ProfileSlice, ProfileState } from './profile-state'

export const createProfileActions: ProfileSlice<Pick<ProfileState,
  'fetchProfileByUsername' | 'fetchMyProfile' | 'updateProfile' | 'updatePersonalInfo' | 'updateSocialLinks' | 'updateInterests' | 'uploadImage'
>> = (set, get) => ({
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
       * Subir imagen (avatar o cover)
       */
      uploadImage: async (file: File, type: 'avatar' | 'cover') => {
        try {
          const result = await profileService.uploadImage(file, type)
          return result.url
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error al subir imagen'
          toast.error(errorMsg)
          throw error
        }
      },
})
