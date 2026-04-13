'use client';

import { toast } from 'sonner';
import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
import { professionalProfileService } from '../../services/professional-profile.service';

export function useFollowStatus(profileId: string | undefined) {
  return useFetch(
    ['profile-follow-status', profileId],
    () => professionalProfileService.checkFollowStatus(profileId!),
    { enabled: !!profileId, staleTime: 1000 * 60 * 5 }
  );
}

export function useFollowProfile() {
  return useAsyncAction(
    (profileId: string) => professionalProfileService.followProfile(profileId),
    {
      onSuccess: (_, profileId) => {
        invalidate(`profile-follow-status::${profileId}`);
        invalidate('professional-profile');
        toast.success('Ahora sigues este perfil');
      },
      onError: (error: any, profileId) => {
        invalidate(`profile-follow-status::${profileId}`);
        const message = error.response?.data?.message || 'Error al seguir el perfil';
        toast.error(message);
        console.error('Error following profile:', error);
      },
    }
  );
}

export function useUnfollowProfile() {
  return useAsyncAction(
    (profileId: string) => professionalProfileService.unfollowProfile(profileId),
    {
      onSuccess: (_, profileId) => {
        invalidate(`profile-follow-status::${profileId}`);
        invalidate('professional-profile');
        toast.success('Dejaste de seguir este perfil');
      },
      onError: (error: any, profileId) => {
        invalidate(`profile-follow-status::${profileId}`);
        const message = error.response?.data?.message || 'Error al dejar de seguir el perfil';
        toast.error(message);
        console.error('Error unfollowing profile:', error);
      },
    }
  );
}
