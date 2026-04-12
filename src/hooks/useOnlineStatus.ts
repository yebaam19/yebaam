'use client';

import { useEffect, useState } from 'react';

/**
 * Hook para detectar el estado de la conexión a internet
 * 
 * @returns {boolean} true si está online, false si está offline
 * 
 * @example
 * ```tsx
 * const isOnline = useOnlineStatus();
 * 
 * if (!isOnline) {
 *   return <OfflineMessage />;
 * }
 * ```
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Handlers para eventos de conexión
    const handleOnline = () => {
      console.log('[useOnlineStatus] Conexión restaurada');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[useOnlineStatus] Conexión perdida');
      setIsOnline(false);
    };

    // Agregar listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default useOnlineStatus;
