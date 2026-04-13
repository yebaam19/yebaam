'use client';

import { useEffect, useState } from 'react';
import { SignalSlashIcon, WifiIcon } from '@/components/icons/heroicons-shim';
import useOnlineStatus from '@/hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [show, setShow] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Mostrar mensaje de "conexión restaurada" brevemente
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div 
        className={`mx-auto max-w-md mt-4 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          isOnline 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          {isOnline ? (
            <>
              <WifiIcon className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Conexión restaurada</p>
                <p className="text-xs opacity-90">Ya puedes continuar usando la aplicación</p>
              </div>
            </>
          ) : (
            <>
              <SignalSlashIcon className="w-5 h-5 shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="font-medium text-sm">Sin conexión a internet</p>
                <p className="text-xs opacity-90">Algunas funciones pueden no estar disponibles</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
