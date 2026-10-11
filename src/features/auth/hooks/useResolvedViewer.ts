'use client';

import { useAuth } from '../context/auth-context';
import { useOptionalCurrentUser } from '../context/current-user.context';

/** Server identity covers hydration; initialized client auth handles logout and account changes. */
export function useResolvedViewer() {
  const { user, isInitialized } = useAuth();
  const serverUser = useOptionalCurrentUser();
  return {
    viewerId: (isInitialized ? user?.id : serverUser?.id) ?? null,
    isReady: isInitialized || !!serverUser,
  };
}
