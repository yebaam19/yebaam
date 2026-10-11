import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useProfileStore } from '@/features/profile/store/profile.store';

type UseAuthSyncOptions = {
  /** Wait for checkAuth() before clearing profile state based on persisted auth. */
  authReady?: boolean;
};

export function useAuthSync(options?: UseAuthSyncOptions) {
  const authReady = options?.authReady ?? true;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const reset = useProfileStore((state) => state.reset);

  useEffect(() => {
    // Auth already reads the viewer's profile. Profile pages load their own data;
    // eagerly fetching here duplicates that read and can overwrite a visited profile.
    if (authReady && !isAuthenticated) reset();
  }, [authReady, isAuthenticated, reset]);
}
