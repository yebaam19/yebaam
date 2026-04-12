/**
 * Profile Followers Hooks
 *
 * React Query hooks para gestionar seguidores de perfiles profesionales
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { professionalProfileService } from '../../services/professional-profile.service'
import { professionalProfileKeys } from './useProfessionalProfileQueries'

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook para verificar si el usuario sigue un perfil
 */
export function useFollowStatus(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile-follow-status', profileId],
    queryFn: () => professionalProfileService.checkFollowStatus(profileId!),
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook para seguir un perfil
 */
export function useFollowProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profileId: string) => professionalProfileService.followProfile(profileId),
    onMutate: async (profileId) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['profile-follow-status', profileId] })

      // Optimistic update
      queryClient.setQueryData(['profile-follow-status', profileId], true)
    },
    onSuccess: (_, profileId) => {
      // Invalidate follow status
      queryClient.invalidateQueries({ queryKey: ['profile-follow-status', profileId] })
      
      // Invalidate profile to update followers count
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.all })
      
      toast.success('Ahora sigues este perfil')
    },
    onError: (error: any, profileId) => {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['profile-follow-status', profileId] })
      
      const message = error.response?.data?.message || 'Error al seguir el perfil'
      toast.error(message)
      console.error('Error following profile:', error)
    },
  })
}

/**
 * Hook para dejar de seguir un perfil
 */
export function useUnfollowProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profileId: string) => professionalProfileService.unfollowProfile(profileId),
    onMutate: async (profileId) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['profile-follow-status', profileId] })

      // Optimistic update
      queryClient.setQueryData(['profile-follow-status', profileId], false)
    },
    onSuccess: (_, profileId) => {
      // Invalidate follow status
      queryClient.invalidateQueries({ queryKey: ['profile-follow-status', profileId] })
      
      // Invalidate profile to update followers count
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.all })
      
      toast.success('Dejaste de seguir este perfil')
    },
    onError: (error: any, profileId) => {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['profile-follow-status', profileId] })
      
      const message = error.response?.data?.message || 'Error al dejar de seguir el perfil'
      toast.error(message)
      console.error('Error unfollowing profile:', error)
    },
  })
}
