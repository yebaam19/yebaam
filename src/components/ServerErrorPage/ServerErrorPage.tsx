'use client';

import { useState, useEffect } from 'react';
import { 
  ServerIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  SignalSlashIcon 
} from '@heroicons/react/24/outline';

interface ServerErrorPageProps {
  onRetry?: () => void;
  message?: string;
  showReload?: boolean;
}

export default function ServerErrorPage({ 
  onRetry, 
  message = 'No pudimos conectar con el servidor',
  showReload = true 
}: ServerErrorPageProps) {
  const [retrying, setRetrying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setRetrying(false);
    }
  };

  // Auto-retry countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && retrying) {
      handleRetry();
    }
  }, [countdown, retrying]);

  const startAutoRetry = () => {
    setCountdown(5);
    setRetrying(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 text-center">
          {/* Animated Icon */}
          <div className="mx-auto w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6 relative">
            {retrying ? (
              <ArrowPathIcon className="w-10 h-10 text-orange-600 dark:text-orange-400 animate-spin" />
            ) : (
              <>
                <ServerIcon className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                <SignalSlashIcon className="w-6 h-6 text-red-600 dark:text-red-400 absolute -bottom-1 -right-1 bg-white dark:bg-neutral-900 rounded-full p-0.5" />
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            {retrying ? 'Reconectando...' : 'Servidor no disponible'}
          </h1>

          {/* Message */}
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {retrying 
              ? countdown > 0 
                ? `Reintentando en ${countdown} segundos...` 
                : 'Conectando con el servidor...'
              : message
            }
          </p>

          {/* Status indicators */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Estado del servidor</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Desconectado
                </span>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-left">
            <div className="flex gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Posibles soluciones:
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Verifica que el servidor esté ejecutándose</li>
                  <li>Revisa tu conexión a internet</li>
                  <li>Comprueba que el servidor esté en el puerto correcto</li>
                  <li>Revisa la consola del servidor por errores</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!retrying && (
              <>
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Reintentar ahora
                </button>
                
                <button
                  onClick={startAutoRetry}
                  disabled={retrying}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-neutral-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Reintentar automáticamente
                </button>
              </>
            )}

            {showReload && !retrying && (
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
              >
                Recargar página completa
              </button>
            )}
          </div>

          {/* Server info (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                Backend URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
