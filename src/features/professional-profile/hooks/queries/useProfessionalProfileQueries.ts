/**
 * Professional Profile Query Hooks (native, no TanStack)
 */

'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { professionalProfileService } from '../../services/professional-profile.service';

// QUERY KEYS
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
};

// PROFILE QUERIES
export function useAllProfiles(limit: number = 50, offset: number = 0) {
  return useFetch(
    [...professionalProfileKeys.list(), limit, offset],
    () => professionalProfileService.getAllProfiles(limit, offset),
    { staleTime: 2 * 60 * 1000 }
  );
}

export function useMyProfile() {
  return useFetch(
    professionalProfileKeys.me(),
    () => professionalProfileService.getMyProfile(),
    { staleTime: 5 * 60 * 1000 }
  );
}

export function useProfileByUserId(userId: string | undefined) {
  return useFetch(
    professionalProfileKeys.byUserId(userId!),
    () => professionalProfileService.getProfileByUserId(userId!),
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  );
}

export function useProfileByUsername(username: string | undefined) {
  return useFetch(
    professionalProfileKeys.byUsername(username!),
    () => professionalProfileService.getProfileByUsername(username!),
    { enabled: !!username, staleTime: 5 * 60 * 1000 }
  );
}

export function useProfileById(profileId: string | undefined) {
  return useFetch(
    professionalProfileKeys.byId(profileId!),
    () => professionalProfileService.getProfileById(profileId!),
    { enabled: !!profileId, staleTime: 5 * 60 * 1000 }
  );
}

// SUB-ENTITIES
export function useTitles(profileId: string | undefined) {
  return useFetch(
    professionalProfileKeys.titles(profileId!),
    () => professionalProfileService.getTitles(profileId!),
    { enabled: !!profileId, staleTime: 3 * 60 * 1000 }
  );
}

export function useStudies(profileId: string | undefined) {
  return useFetch(
    professionalProfileKeys.studies(profileId!),
    () => professionalProfileService.getStudies(profileId!),
    { enabled: !!profileId, staleTime: 3 * 60 * 1000 }
  );
}

export function useExperience(profileId: string | undefined) {
  return useFetch(
    professionalProfileKeys.experience(profileId!),
    () => professionalProfileService.getExperience(profileId!),
    { enabled: !!profileId, staleTime: 3 * 60 * 1000 }
  );
}

export function useSkills(profileId: string | undefined) {
  return useFetch(
    professionalProfileKeys.skills(profileId!),
    () => professionalProfileService.getSkills(profileId!),
    { enabled: !!profileId, staleTime: 3 * 60 * 1000 }
  );
}

export function useLanguages(profileId: string | undefined) {
  return useFetch(
    professionalProfileKeys.languages(profileId!),
    () => professionalProfileService.getLanguages(profileId!),
    { enabled: !!profileId, staleTime: 3 * 60 * 1000 }
  );
}

export function useLicenses(profileId: string | undefined) {
  return useFetch(
    professionalProfileKeys.licenses(profileId!),
    () => professionalProfileService.getLicenses(profileId!),
    { enabled: !!profileId, staleTime: 3 * 60 * 1000 }
  );
}

export function useAssociations(profileId: string | undefined) {
  return useFetch(
    professionalProfileKeys.associations(profileId!),
    () => professionalProfileService.getAssociations(profileId!),
    { enabled: !!profileId, staleTime: 3 * 60 * 1000 }
  );
}
