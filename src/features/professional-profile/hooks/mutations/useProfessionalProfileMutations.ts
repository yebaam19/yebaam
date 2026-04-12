/**
 * Professional Profile React Query Mutations
 *
 * Hooks para mutations (POST, PUT, DELETE) del perfil profesional usando React Query
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  AssociationFormData,
  CreateProfessionalProfileDTO,
  ExperienceFormData,
  LanguageFormData,
  LicenseFormData,
  ProfessionalProfile,
  SkillFormData,
  StudyFormData,
  TitleFormData,
  UpdateProfessionalProfileDTO,
} from '../../interfaces/professional-profile.interfaces'
import { professionalProfileService } from '../../services/professional-profile.service'
import { professionalProfileKeys } from '../queries/useProfessionalProfileQueries'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Invalida todas las queries relacionadas con un perfil
 * Útil después de mutations para forzar refetch y actualizar UI
 */
function invalidateProfileQueries(queryClient: ReturnType<typeof useQueryClient>, profileId?: string) {
  // Invalidar query principal (me)
  queryClient.invalidateQueries({ queryKey: professionalProfileKeys.me() })

  // Invalidar query por profileId si está disponible
  if (profileId) {
    queryClient.invalidateQueries({ queryKey: professionalProfileKeys.byId(profileId) })
  }

  // Invalidar TODAS las queries de professional-profile para asegurar actualización
  queryClient.invalidateQueries({ queryKey: professionalProfileKeys.all })
}

// ============================================================================
// PROFILE MUTATIONS
// ============================================================================

/**
 * Hook para crear un perfil profesional
 */
export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProfessionalProfileDTO) => professionalProfileService.createProfile(data),
    onSuccess: (profile) => {
      // Invalidar la query de "mi perfil" para refrescar
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.me() })

      // Opcional: Setear el perfil directamente en cache para UX instantánea
      queryClient.setQueryData(professionalProfileKeys.me(), profile)

      toast.success('Perfil profesional creado correctamente')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear perfil profesional'
      toast.error(message)
      console.error('[useCreateProfile] Error:', error)
    },
  })
}

/**
 * Hook para actualizar un perfil profesional
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: UpdateProfessionalProfileDTO }) =>
      professionalProfileService.updateProfile(profileId, data),
    onMutate: async ({ profileId, data }) => {
      // Cancelar queries en curso para evitar conflictos
      await queryClient.cancelQueries({ queryKey: professionalProfileKeys.all })

      const previousProfile = queryClient.getQueryData<ProfessionalProfile>(professionalProfileKeys.me())

      // Optimistic update: Actualizar UI inmediatamente
      if (previousProfile) {
        const optimisticProfile = {
          ...previousProfile,
          ...data,
          updatedAt: new Date().toISOString(),
        }
        
        // Actualizar todas las queries posibles
        queryClient.setQueryData(professionalProfileKeys.me(), optimisticProfile)
        queryClient.setQueryData(professionalProfileKeys.byId(profileId), optimisticProfile)
        
        // Si tenemos el username, actualizar también esa query
        if (previousProfile.user?.username) {
          queryClient.setQueryData(
            professionalProfileKeys.byUsername(previousProfile.user.username),
            optimisticProfile
          )
        }
      }

      return { previousProfile }
    },
    onSuccess: (updatedProfile) => {
      // Forzar refetch de todas las queries relacionadas
      invalidateProfileQueries(queryClient, updatedProfile.id)
      
      // Actualizar con los datos reales del servidor
      queryClient.setQueryData(professionalProfileKeys.me(), updatedProfile)
      queryClient.setQueryData(professionalProfileKeys.byId(updatedProfile.id), updatedProfile)
      
      // Si tenemos username en la respuesta, actualizar esa query también
      if (updatedProfile.user?.username) {
        queryClient.setQueryData(
          professionalProfileKeys.byUsername(updatedProfile.user.username),
          updatedProfile
        )
      }

      toast.success('Perfil actualizado correctamente')
    },
    onError: (error: any, variables, context) => {
      // Revertir optimistic update si falla
      if (context?.previousProfile) {
        queryClient.setQueryData(professionalProfileKeys.me(), context.previousProfile)
      }

      const message = error.response?.data?.message || 'Error al actualizar perfil'
      toast.error(message)
      console.error('[useUpdateProfile] Error:', error)
    },
  })
}

/**
 * Hook para eliminar un perfil profesional
 */
export function useDeleteProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profileId: string) => professionalProfileService.deleteProfile(profileId),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con perfiles
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.all })

      toast.success('Perfil profesional eliminado')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al eliminar perfil'
      toast.error(message)
      console.error('[useDeleteProfile] Error:', error)
    },
  })
}

// ============================================================================
// TITLES MUTATIONS
// ============================================================================

export function useAddTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: TitleFormData }) =>
      professionalProfileService.addTitle(profileId, data),
    onSuccess: (_, { profileId }) => {
      // Invalidar todas las queries relacionadas con este perfil
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.titles(profileId) })
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.me() })
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.byId(profileId) })
      // Invalidar también queries por userId y username
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.all })
      toast.success('Título agregado correctamente')
    },
    onError: (error: any) => {
      toast.error('Error al agregar título')
      console.error('[useAddTitle] Error:', error)
    },
  })
}

export function useUpdateTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, titleId, data }: { profileId: string; titleId: string; data: TitleFormData }) =>
      professionalProfileService.updateTitle(profileId, titleId, data),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.titles(profileId) })
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.me() })
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.byId(profileId) })
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.all })
      toast.success('Título actualizado correctamente')
    },
    onError: (error: any) => {
      toast.error('Error al actualizar título')
      console.error('[useUpdateTitle] Error:', error)
    },
  })
}

export function useDeleteTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, titleId }: { profileId: string; titleId: string }) =>
      professionalProfileService.deleteTitle(profileId, titleId),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.titles(profileId) })
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.me() })
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.byId(profileId) })
      queryClient.invalidateQueries({ queryKey: professionalProfileKeys.all })
      toast.success('Título eliminado')
    },
    onError: (error: any) => {
      toast.error('Error al eliminar título')
      console.error('[useDeleteTitle] Error:', error)
    },
  })
}

// ============================================================================
// STUDIES MUTATIONS
// ============================================================================

export function useAddStudy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: StudyFormData }) =>
      professionalProfileService.addStudy(profileId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Estudio agregado correctamente')
    },
    onError: () => toast.error('Error al agregar estudio'),
  })
}

export function useUpdateStudy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, studyId, data }: { profileId: string; studyId: string; data: StudyFormData }) =>
      professionalProfileService.updateStudy(profileId, studyId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Estudio actualizado correctamente')
    },
    onError: () => toast.error('Error al actualizar estudio'),
  })
}

export function useDeleteStudy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, studyId }: { profileId: string; studyId: string }) =>
      professionalProfileService.deleteStudy(profileId, studyId),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Estudio eliminado')
    },
    onError: () => toast.error('Error al eliminar estudio'),
  })
}

// ============================================================================
// EXPERIENCE MUTATIONS
// ============================================================================

export function useAddExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: ExperienceFormData }) =>
      professionalProfileService.addExperience(profileId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Experiencia agregada correctamente')
    },
    onError: () => toast.error('Error al agregar experiencia'),
  })
}

export function useUpdateExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      profileId,
      experienceId,
      data,
    }: {
      profileId: string
      experienceId: string
      data: ExperienceFormData
    }) => professionalProfileService.updateExperience(profileId, experienceId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Experiencia actualizada correctamente')
    },
    onError: () => toast.error('Error al actualizar experiencia'),
  })
}

export function useDeleteExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, experienceId }: { profileId: string; experienceId: string }) =>
      professionalProfileService.deleteExperience(profileId, experienceId),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Experiencia eliminada')
    },
    onError: () => toast.error('Error al eliminar experiencia'),
  })
}

// ============================================================================
// SKILLS MUTATIONS
// ============================================================================

export function useAddSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: SkillFormData }) =>
      professionalProfileService.addSkill(profileId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Habilidad agregada correctamente')
    },
    onError: () => toast.error('Error al agregar habilidad'),
  })
}

export function useUpdateSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, skillId, data }: { profileId: string; skillId: string; data: SkillFormData }) =>
      professionalProfileService.updateSkill(profileId, skillId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Habilidad actualizada correctamente')
    },
    onError: () => toast.error('Error al actualizar habilidad'),
  })
}

export function useDeleteSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, skillId }: { profileId: string; skillId: string }) =>
      professionalProfileService.deleteSkill(profileId, skillId),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Habilidad eliminada')
    },
    onError: () => toast.error('Error al eliminar habilidad'),
  })
}

// ============================================================================
// LANGUAGES MUTATIONS
// ============================================================================

export function useAddLanguage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: LanguageFormData }) =>
      professionalProfileService.addLanguage(profileId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Idioma agregado correctamente')
    },
    onError: () => toast.error('Error al agregar idioma'),
  })
}

export function useUpdateLanguage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, languageId, data }: { profileId: string; languageId: string; data: LanguageFormData }) =>
      professionalProfileService.updateLanguage(profileId, languageId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Idioma actualizado correctamente')
    },
    onError: () => toast.error('Error al actualizar idioma'),
  })
}

export function useDeleteLanguage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, languageId }: { profileId: string; languageId: string }) =>
      professionalProfileService.deleteLanguage(profileId, languageId),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Idioma eliminado')
    },
    onError: () => toast.error('Error al eliminar idioma'),
  })
}

// ============================================================================
// LICENSES MUTATIONS
// ============================================================================

export function useAddLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: LicenseFormData }) =>
      professionalProfileService.addLicense(profileId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Licencia agregada correctamente')
    },
    onError: () => toast.error('Error al agregar licencia'),
  })
}

export function useUpdateLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, licenseId, data }: { profileId: string; licenseId: string; data: LicenseFormData }) =>
      professionalProfileService.updateLicense(profileId, licenseId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Licencia actualizada correctamente')
    },
    onError: () => toast.error('Error al actualizar licencia'),
  })
}

export function useDeleteLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, licenseId }: { profileId: string; licenseId: string }) =>
      professionalProfileService.deleteLicense(profileId, licenseId),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Licencia eliminada')
    },
    onError: () => toast.error('Error al eliminar licencia'),
  })
}

// ============================================================================
// ASSOCIATIONS MUTATIONS
// ============================================================================

export function useAddAssociation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: AssociationFormData }) =>
      professionalProfileService.addAssociation(profileId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Asociación agregada correctamente')
    },
    onError: () => toast.error('Error al agregar asociación'),
  })
}

export function useUpdateAssociation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      profileId,
      associationId,
      data,
    }: {
      profileId: string
      associationId: string
      data: AssociationFormData
    }) => professionalProfileService.updateAssociation(profileId, associationId, data),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Asociación actualizada correctamente')
    },
    onError: () => toast.error('Error al actualizar asociación'),
  })
}

export function useDeleteAssociation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, associationId }: { profileId: string; associationId: string }) =>
      professionalProfileService.deleteAssociation(profileId, associationId),
    onSuccess: (_, { profileId }) => {
      invalidateProfileQueries(queryClient, profileId)
      toast.success('Asociación eliminada')
    },
    onError: () => toast.error('Error al eliminar asociación'),
  })
}
