/**
 * Professional Profile React Query Hooks
 *
 * Hooks para queries (GET) del perfil profesional usando React Query
 */

'use client'

import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { professionalProfileService } from '../../services/professional-profile.service'
import type { ProfessionalProfile } from '../../interfaces/professional-profile.interfaces'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const professionalProfileKeys = {
  all: ['professional-profile'] as const,
  list: () => [...professionalProfileKeys.all, 'list'] as const,
  me: () => [...professionalProfileKeys.all, 'me'] as const,
  byUserId: (userId: string) => [...professionalProfileKeys.all, 'user', userId] as const,
  byUsername: (username: string) => [...professionalProfileKeys.all, 'username', username] as const,
  byId: (profileId: string) => [...professionalProfileKeys.all, 'profile', profileId] as const,
  titles: (profileId: string) => [...professionalProfileKeys.all, 'titles', profileId] as const,
  studies: (profileId: string) => [...professionalProfileKeys.all, 'studies', profileId] as const,
  experience: (profileId: string) => [...professionalProfileKeys.all, 'experience', profileId] as const,
  skills: (profileId: string) => [...professionalProfileKeys.all, 'skills', profileId] as const,
  languages: (profileId: string) => [...professionalProfileKeys.all, 'languages', profileId] as const,
  licenses: (profileId: string) => [...professionalProfileKeys.all, 'licenses', profileId] as const,
  associations: (profileId: string) => [...professionalProfileKeys.all, 'associations', profileId] as const,
}

// ============================================================================
// PROFILE QUERIES
// ============================================================================

/**
 * Hook para obtener todos los perfiles profesionales públicos
 */
export function useAllProfiles(
  limit: number = 50,
  offset: number = 0,
  options?: Omit<UseQueryOptions<{ profiles: ProfessionalProfile[]; total: number }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...professionalProfileKeys.list(), limit, offset],
    queryFn: () => professionalProfileService.getAllProfiles(limit, offset),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    ...options,
  })
}

/**
 * Hook para obtener el perfil profesional del usuario actual
 */
export function useMyProfile(options?: Omit<UseQueryOptions<ProfessionalProfile | null>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: professionalProfileKeys.me(),
    queryFn: () => professionalProfileService.getMyProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutos - los perfiles no cambian tan frecuentemente
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
    retry: 1, // Solo 1 retry para evitar múltiples requests fallidos
    ...options,
  })
}

/**
 * Hook para obtener un perfil profesional por ID de usuario
 */
export function useProfileByUserId(
  userId: string | undefined,
  options?: Omit<UseQueryOptions<ProfessionalProfile | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: professionalProfileKeys.byUserId(userId!),
    queryFn: () => professionalProfileService.getProfileByUserId(userId!),
    enabled: !!userId, // Solo ejecutar si tenemos userId
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    ...options,
  })
}

/**
 * Hook para obtener un perfil profesional por username (SEO-friendly)
 */
export function useProfileByUsername(
  username: string | undefined,
  options?: Omit<UseQueryOptions<ProfessionalProfile | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: professionalProfileKeys.byUsername(username!),
    queryFn: () => professionalProfileService.getProfileByUsername(username!),
    enabled: !!username, // Solo ejecutar si tenemos username
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    ...options,
  })
}

/**
 * Hook para obtener un perfil profesional por ID de perfil
 */
export function useProfileById(
  profileId: string | undefined,
  options?: Omit<UseQueryOptions<ProfessionalProfile | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: professionalProfileKeys.byId(profileId!),
    queryFn: () => professionalProfileService.getProfileById(profileId!),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    ...options,
  })
}

// ============================================================================
// SUB-ENTITIES QUERIES
// ============================================================================

/**
 * Hook para obtener títulos profesionales
 */
export function useTitles(profileId: string | undefined) {
  return useQuery({
    queryKey: professionalProfileKeys.titles(profileId!),
    queryFn: () => professionalProfileService.getTitles(profileId!),
    enabled: !!profileId,
    staleTime: 3 * 60 * 1000, // 3 minutos - las sub-entidades pueden cambiar más frecuentemente
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook para obtener estudios
 */
export function useStudies(profileId: string | undefined) {
  return useQuery({
    queryKey: professionalProfileKeys.studies(profileId!),
    queryFn: () => professionalProfileService.getStudies(profileId!),
    enabled: !!profileId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook para obtener experiencia laboral
 */
export function useExperience(profileId: string | undefined) {
  return useQuery({
    queryKey: professionalProfileKeys.experience(profileId!),
    queryFn: () => professionalProfileService.getExperience(profileId!),
    enabled: !!profileId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook para obtener habilidades
 */
export function useSkills(profileId: string | undefined) {
  return useQuery({
    queryKey: professionalProfileKeys.skills(profileId!),
    queryFn: () => professionalProfileService.getSkills(profileId!),
    enabled: !!profileId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook para obtener idiomas
 */
export function useLanguages(profileId: string | undefined) {
  return useQuery({
    queryKey: professionalProfileKeys.languages(profileId!),
    queryFn: () => professionalProfileService.getLanguages(profileId!),
    enabled: !!profileId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook para obtener licencias
 */
export function useLicenses(profileId: string | undefined) {
  return useQuery({
    queryKey: professionalProfileKeys.licenses(profileId!),
    queryFn: () => professionalProfileService.getLicenses(profileId!),
    enabled: !!profileId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Hook para obtener asociaciones profesionales
 */
export function useAssociations(profileId: string | undefined) {
  return useQuery({
    queryKey: professionalProfileKeys.associations(profileId!),
    queryFn: () => professionalProfileService.getAssociations(profileId!),
    enabled: !!profileId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
