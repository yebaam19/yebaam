'use client';

import { useMyProfile, useUserProfile } from '@/features/user';
import type { UserProfile } from '@/features/user/services/user-profile.service';

interface UseProfileDataReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  displayName: string;
  locationString?: string;
  educationString?: string;
  updateProfile?: (data: Partial<UserProfile>) => Promise<UserProfile>;
}

/**
 * Custom hook to handle profile data fetching and transformation
 * Handles both own profile and other user profiles
 */
export function useProfileData(username: string, isOwnProfile: boolean): UseProfileDataReturn {
  // Obtener perfil: si es propio, usar useMyProfile, si no, usar useUserProfile
  const { 
    profile: myProfile, 
    isLoading: isLoadingMyProfile,
    error: myProfileError,
    updateProfile 
  } = useMyProfile();
  
  const { 
    profile: otherProfile, 
    isLoading: isLoadingOtherProfile,
    error: otherProfileError 
  } = useUserProfile(isOwnProfile ? '' : username);

  // Seleccionar el perfil correcto
  const profile = isOwnProfile ? myProfile : otherProfile;
  const isLoading = isOwnProfile ? isLoadingMyProfile : isLoadingOtherProfile;
  const error = isOwnProfile ? myProfileError : otherProfileError;

  // Transformations
  const displayName = profile && profile.firstName && profile.lastName 
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.username || '';

  // Format location for display
  const locationString = profile?.location
    ? [profile.location.city, profile.location.state, profile.location.country]
        .filter(Boolean)
        .join(', ')
    : undefined;

  // Format education for display (using first entry if available). The
  // education column on profiles is JSONB and typed as `unknown`, so we
  // narrow it through an intermediate cast.
  const educationArr = Array.isArray(profile?.education)
    ? (profile.education as Array<{ institution?: string }>)
    : [];
  const educationString =
    educationArr.length > 0 ? educationArr[0]?.institution : undefined;

  return {
    profile,
    isLoading,
    error,
    displayName,
    locationString,
    educationString,
    updateProfile: isOwnProfile ? updateProfile : undefined,
  };
}
