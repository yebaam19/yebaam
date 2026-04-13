import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useProfileStore } from '@/features/profile/store/profile.store';

type UseAuthSyncOptions = {
  /** When false, skip profile fetch so persisted Zustand auth does not hit the API before checkAuth(). */
  authReady?: boolean;
};

export function useAuthSync(options?: UseAuthSyncOptions) {
  const authReady = options?.authReady ?? true;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const fetchMyProfile = useProfileStore((state) => state.fetchMyProfile);
  const reset = useProfileStore((state) => state.reset);

  const hasLoadedProfile = useRef(false);

  useEffect(() => {
    if (!authReady) return;

    if (isAuthenticated && user && !hasLoadedProfile.current) {
      fetchMyProfile()
        .then(() => {
          hasLoadedProfile.current = true;
        })
        .catch(() => {
          // No bloqueamos la app si falla la carga del perfil
        });
    } else if (!isAuthenticated) {
      reset();
      hasLoadedProfile.current = false;
    }
  }, [authReady, isAuthenticated, user, fetchMyProfile, reset]);
}
