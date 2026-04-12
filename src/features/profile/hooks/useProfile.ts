/**
 * Profile Hooks
 *
 * Custom hooks para usar el ProfileStore
 * Estos hooks facilitan el acceso al estado y acciones del store de perfil
 */

import React from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useProfileStore } from '../store/profile.store'

/**
 * Hook para obtener el perfil actual
 */
export const useCurrentProfile = () => {
  return useProfileStore(
    useShallow((state) => ({
      profile: state.currentProfile,
      isLoading: state.isLoading,
      error: state.error,
    }))
  )
}

/**
 * Hook para acciones de perfil
 */
export const useProfileActions = () => {
  return useProfileStore(
    useShallow((state) => ({
      fetchProfileByUsername: state.fetchProfileByUsername,
      fetchMyProfile: state.fetchMyProfile,
      updateProfile: state.updateProfile,
      updatePersonalInfo: state.updatePersonalInfo,
      updateSocialLinks: state.updateSocialLinks,
      updateInterests: state.updateInterests,
      uploadImage: state.uploadImage,
      clearError: state.clearError,
      reset: state.reset,
    }))
  )
}

/**
 * Hook para posts del usuario
 */
export const useUserPosts = () => {
  return useProfileStore(
    useShallow((state) => ({
      posts: state.userPosts,
      isLoading: state.isLoadingPosts,
      hasMore: state.hasMorePosts,
      fetchUserPosts: state.fetchUserPosts,
      loadMore: state.loadMorePosts,
    }))
  )
}

/**
 * Hook para fotos del usuario
 */
export const useUserPhotos = () => {
  return useProfileStore(
    useShallow((state) => ({
      photos: state.userPhotos,
      isLoading: state.isLoadingPhotos,
      hasMore: state.hasMorePhotos,
      fetchUserPhotos: state.fetchUserPhotos,
      loadMore: state.loadMorePhotos,
    }))
  )
}

/**
 * Hook para videos del usuario
 */
export const useUserVideos = () => {
  return useProfileStore(
    useShallow((state) => ({
      videos: state.userVideos,
      isLoading: state.isLoadingVideos,
      hasMore: state.hasMoreVideos,
      fetchUserVideos: state.fetchUserVideos,
      loadMore: state.loadMoreVideos,
    }))
  )
}

/**
 * Hook para obtener perfil por username (con carga automática)
 */
export const useProfile = (username: string) => {
  const profile = useProfileStore((state) => state.profiles.get(username))
  const currentProfile = useProfileStore((state) => state.currentProfile)
  const isLoading = useProfileStore((state) => state.isLoading)
  const fetchProfileByUsername = useProfileStore((state) => state.fetchProfileByUsername)

  // Usar ref para evitar bucle infinito
  const hasAttemptedFetch = React.useRef(false)

  // Si el perfil no está en cache y no estamos cargando, cargarlo
  React.useEffect(() => {
    if (!profile && !isLoading && username && !hasAttemptedFetch.current) {
      hasAttemptedFetch.current = true
      fetchProfileByUsername(username)
    }
  }, [username, profile, isLoading])

  // Reset el flag cuando cambia el username
  React.useEffect(() => {
    hasAttemptedFetch.current = false
  }, [username])

  // Retornar el perfil de cache o el currentProfile si coincide
  const effectiveProfile = profile || (currentProfile?.username === username ? currentProfile : null)

  return {
    profile: effectiveProfile,
    isLoading,
  }
}
