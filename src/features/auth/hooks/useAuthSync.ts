
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useProfileStore } from '@/features/profile/store/profile.store';


export function useAuthSync() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const fetchMyProfile = useProfileStore((state) => state.fetchMyProfile);
  const reset = useProfileStore((state) => state.reset);
  
  // Usar ref para evitar múltiples cargas
  const hasLoadedProfile = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !hasLoadedProfile.current) {
     
      
      fetchMyProfile()
        .then(() => {
      
          hasLoadedProfile.current = true;
        })
        .catch((error) => {
          // No bloqueamos la app si falla la carga del perfil
        });
    } else if (!isAuthenticated) {
      reset();
      hasLoadedProfile.current = false;
    }
  }, [isAuthenticated, user, fetchMyProfile, reset]);
}
