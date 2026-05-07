/**
 * Profile Hooks
 *
 * Custom hooks para usar el ProfileStore
 * Estos hooks facilitan el acceso al estado y acciones del store de perfil
 */

import React from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useProfileStore } from '../store/profile.store'
import { profileMapKey } from '../store/profile-map-key'

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
  const profile = useProfileStore(
    (state) =>
      state.profiles.get(profileMapKey(username)) ?? (username?.trim() ? state.profiles.get(username) : undefined)
  )
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
  }, [username, profile, isLoading, fetchProfileByUsername])

  // Reset el flag cuando cambia el username
  React.useEffect(() => {
    hasAttemptedFetch.current = false
  }, [username])

  const routeKey = username?.trim() ? profileMapKey(username) : ''

  const effectiveProfile =
    profile ||
    (currentProfile && routeKey && profileMapKey(currentProfile.username) === routeKey
      ? currentProfile
      : null)

  // Al navegar a un perfil ya cacheado fetch no corre; mantener currentProfile alineado con la ruta
  React.useEffect(() => {
    if (!routeKey) return
    const cached = useProfileStore.getState().profiles.get(routeKey)
    const current = useProfileStore.getState().currentProfile
    const aligned =
      cached ||
      (current && profileMapKey(current.username || '') === routeKey ? current : null)
    if (!aligned || profileMapKey(aligned.username || '') !== routeKey) return
    if (useProfileStore.getState().currentProfile?.userId !== aligned.userId) {
      useProfileStore.setState({ currentProfile: aligned })
    }
  }, [routeKey, profile?.userId, currentProfile?.userId])

  return {
    profile: effectiveProfile,
    isLoading,
  }
}
