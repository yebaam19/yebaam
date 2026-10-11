'use client';

import { useEffect, useState } from 'react';
import { SignalSlashIcon, WifiIcon } from '@/components/icons/heroicons-shim';
import useOnlineStatus from '@/hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [previousOnline, setPreviousOnline] = useState(isOnline);
  const [restored, setRestored] = useState(false);
  if (previousOnline !== isOnline) {
    setPreviousOnline(isOnline);
    setRestored(isOnline);
  }
  useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(() => setRestored(false), 3000);
    return () => clearTimeout(timer);
  }, [restored]);
  const show = !isOnline || restored;

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
