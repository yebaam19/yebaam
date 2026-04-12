/**
 * Professional Profile Hook
 *
 * Custom hook para gestionar la lógica del perfil profesional
 */

'use client'

import { useCallback, useEffect } from 'react'
import { useProfessionalProfileStore } from '../store/professional-profile.store'

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useProfessionalProfile(userId?: string) {
  const { myProfile, currentProfile, isLoading, error, fetchMyProfile, fetchProfileByUserId, clearError } =
    useProfessionalProfileStore()

  useEffect(() => {
    if (userId) {
      fetchProfileByUserId(userId)
    } else {
      fetchMyProfile()
    }
  }, [userId, fetchMyProfile, fetchProfileByUserId])

  const refetch = useCallback(() => {
    if (userId) {
      fetchProfileByUserId(userId)
    } else {
      fetchMyProfile()
    }
  }, [userId, fetchMyProfile, fetchProfileByUserId])

  return {
    profile: userId ? currentProfile : myProfile,
    isLoading,
    error,
    refetch,
    clearError,
    hasProfile: !!(userId ? currentProfile : myProfile),
  }
}

// ============================================================================
// TITLES HOOK
// ============================================================================

export function useTitles(profileId: string | undefined) {
  const { titles, isLoadingSection, fetchTitles, addTitle, updateTitle, deleteTitle } = useProfessionalProfileStore()

  useEffect(() => {
    if (profileId) {
      fetchTitles(profileId)
    }
  }, [profileId, fetchTitles])

  return {
    titles,
    isLoading: isLoadingSection,
    addTitle: profileId ? (data: Parameters<typeof addTitle>[1]) => addTitle(profileId, data) : undefined,
    updateTitle: profileId
      ? (titleId: string, data: Parameters<typeof updateTitle>[2]) => updateTitle(profileId, titleId, data)
      : undefined,
    deleteTitle: profileId ? (titleId: string) => deleteTitle(profileId, titleId) : undefined,
    refetch: profileId ? () => fetchTitles(profileId) : undefined,
  }
}

// ============================================================================
// STUDIES HOOK
// ============================================================================

export function useStudies(profileId: string | undefined) {
  const { studies, isLoadingSection, fetchStudies, addStudy, updateStudy, deleteStudy } = useProfessionalProfileStore()

  useEffect(() => {
    if (profileId) {
      fetchStudies(profileId)
    }
  }, [profileId, fetchStudies])

  return {
    studies,
    isLoading: isLoadingSection,
    addStudy: profileId ? (data: Parameters<typeof addStudy>[1]) => addStudy(profileId, data) : undefined,
    updateStudy: profileId
      ? (studyId: string, data: Parameters<typeof updateStudy>[2]) => updateStudy(profileId, studyId, data)
      : undefined,
    deleteStudy: profileId ? (studyId: string) => deleteStudy(profileId, studyId) : undefined,
    refetch: profileId ? () => fetchStudies(profileId) : undefined,
  }
}

// ============================================================================
// EXPERIENCE HOOK
// ============================================================================

export function useExperience(profileId: string | undefined) {
  const { experience, isLoadingSection, fetchExperience, addExperience, updateExperience, deleteExperience } =
    useProfessionalProfileStore()

  useEffect(() => {
    if (profileId) {
      fetchExperience(profileId)
    }
  }, [profileId, fetchExperience])

  return {
    experience,
    isLoading: isLoadingSection,
    addExperience: profileId
      ? (data: Parameters<typeof addExperience>[1]) => addExperience(profileId, data)
      : undefined,
    updateExperience: profileId
      ? (experienceId: string, data: Parameters<typeof updateExperience>[2]) =>
          updateExperience(profileId, experienceId, data)
      : undefined,
    deleteExperience: profileId ? (experienceId: string) => deleteExperience(profileId, experienceId) : undefined,
    refetch: profileId ? () => fetchExperience(profileId) : undefined,
  }
}

// ============================================================================
// SKILLS HOOK
// ============================================================================

export function useSkills(profileId: string | undefined) {
  const { skills, isLoadingSection, fetchSkills, addSkill, updateSkill, deleteSkill } = useProfessionalProfileStore()

  useEffect(() => {
    if (profileId) {
      fetchSkills(profileId)
    }
  }, [profileId, fetchSkills])

  return {
    skills,
    isLoading: isLoadingSection,
    addSkill: profileId ? (data: Parameters<typeof addSkill>[1]) => addSkill(profileId, data) : undefined,
    updateSkill: profileId
      ? (skillId: string, data: Parameters<typeof updateSkill>[2]) => updateSkill(profileId, skillId, data)
      : undefined,
    deleteSkill: profileId ? (skillId: string) => deleteSkill(profileId, skillId) : undefined,
    refetch: profileId ? () => fetchSkills(profileId) : undefined,
  }
}

// ============================================================================
// LANGUAGES HOOK
// ============================================================================

export function useLanguages(profileId: string | undefined) {
  const { languages, isLoadingSection, fetchLanguages, addLanguage, updateLanguage, deleteLanguage } =
    useProfessionalProfileStore()

  useEffect(() => {
    if (profileId) {
      fetchLanguages(profileId)
    }
  }, [profileId, fetchLanguages])

  return {
    languages,
    isLoading: isLoadingSection,
    addLanguage: profileId ? (data: Parameters<typeof addLanguage>[1]) => addLanguage(profileId, data) : undefined,
    updateLanguage: profileId
      ? (languageId: string, data: Parameters<typeof updateLanguage>[2]) => updateLanguage(profileId, languageId, data)
      : undefined,
    deleteLanguage: profileId ? (languageId: string) => deleteLanguage(profileId, languageId) : undefined,
    refetch: profileId ? () => fetchLanguages(profileId) : undefined,
  }
}

// ============================================================================
// LICENSES HOOK
// ============================================================================

export function useLicenses(profileId: string | undefined) {
  const { licenses, isLoadingSection, fetchLicenses, addLicense, updateLicense, deleteLicense } =
    useProfessionalProfileStore()

  useEffect(() => {
    if (profileId) {
      fetchLicenses(profileId)
    }
  }, [profileId, fetchLicenses])

  return {
    licenses,
    isLoading: isLoadingSection,
    addLicense: profileId ? (data: Parameters<typeof addLicense>[1]) => addLicense(profileId, data) : undefined,
    updateLicense: profileId
      ? (licenseId: string, data: Parameters<typeof updateLicense>[2]) => updateLicense(profileId, licenseId, data)
      : undefined,
    deleteLicense: profileId ? (licenseId: string) => deleteLicense(profileId, licenseId) : undefined,
    refetch: profileId ? () => fetchLicenses(profileId) : undefined,
  }
}

// ============================================================================
// ASSOCIATIONS HOOK
// ============================================================================

export function useAssociations(profileId: string | undefined) {
  const { associations, isLoadingSection, fetchAssociations, addAssociation, updateAssociation, deleteAssociation } =
    useProfessionalProfileStore()

  useEffect(() => {
    if (profileId) {
      fetchAssociations(profileId)
    }
  }, [profileId, fetchAssociations])

  return {
    associations,
    isLoading: isLoadingSection,
    addAssociation: profileId
      ? (data: Parameters<typeof addAssociation>[1]) => addAssociation(profileId, data)
      : undefined,
    updateAssociation: profileId
      ? (associationId: string, data: Parameters<typeof updateAssociation>[2]) =>
          updateAssociation(profileId, associationId, data)
      : undefined,
    deleteAssociation: profileId ? (associationId: string) => deleteAssociation(profileId, associationId) : undefined,
    refetch: profileId ? () => fetchAssociations(profileId) : undefined,
  }
}
