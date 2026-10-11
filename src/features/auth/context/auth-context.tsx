/**
 * Auth Context Provider
 *
 * Proveedor de contexto para autenticación.
 * Combina el store de Zustand con React Context para facilitar el uso.
 *
 * Responsabilidades:
 * - Inicializar la autenticación al montar la app
 * - Proveer funciones de auth a componentes hijos
 * - Manejar la verificación de sesión inicial
 *
 * Uso:
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */

'use client';

import ServerErrorPage from '@/components/ServerErrorPage';
import { isAuthConnectionError } from '@/lib/auth/connection-error';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthSync } from '../hooks/useAuthSync';
import type {
  AuthUser,
  LoginDTO,
  RegisterDTO,
  ResendOtpRequest,
  VerifyEmailRequest,
} from '../interfaces/auth.interfaces';
import { useAuthStore } from '../store/auth.store';

/**
 * Tipo del contexto de autenticación
 */
interface AuthContextType {
  // Estado
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Acciones
  login: (credentials: LoginDTO) => Promise<void>;
  register: ReturnType<typeof useAuthStore.getState>['register'];
  logout: () => Promise<void>;
  verifyEmail: (data: VerifyEmailRequest) => Promise<void>;
  resendOtp: (data: ResendOtpRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

/**
 * Contexto de autenticación
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props del AuthProvider
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Proveedor de autenticación
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [initialization, setInitialization] = useState<'checking' | 'ready' | 'unavailable'>('checking');
  const isInitialized = initialization !== 'checking';

  // Limpiar el perfil al cerrar sesión, una vez verificado el estado de autenticación.
  useAuthSync({ authReady: isInitialized });

  // Obtener estado y acciones del store
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    verifyEmail,
    resendOtp,
    checkAuth,
    clearError,
  } = useAuthStore();

  /**
   * Inicializar autenticación al montar
   * Verifica si hay una sesión activa
   */
  useEffect(() => {
    let cancelled = false;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const initAuth = async () => {
      try {
        await checkAuth({ throwOnConnectionError: true });
      } catch (error: unknown) {
        if (cancelled) return;
        console.error('[AuthProvider] Error al inicializar autenticación:', error);

        const isConnectionError = isAuthConnectionError(error);

        if (isConnectionError && retryCount < 3) {
          const delayMs = Math.min(1000 * Math.pow(2, retryCount), 5000);
          retryCount += 1;
          console.warn(`[AuthProvider] Reintentando... (${retryCount}/3)`);
          retryTimer = setTimeout(() => { void initAuth(); }, delayMs);
          return;
        }
        setInitialization(isConnectionError ? 'unavailable' : 'ready');
        return;
      }
      if (!cancelled) setInitialization('ready');
    };

    void initAuth();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [checkAuth]);

  /**
   * Reintentar conexión manualmente
   */
  const handleRetry = async () => {
    setInitialization('checking');

    try {
      await checkAuth({ throwOnConnectionError: true });
      setInitialization('ready');
    } catch (error) {
      console.error('[AuthProvider] Error en retry:', error);
      setInitialization('unavailable');
    }
  };

  /**
   * Refresca los datos del usuario desde el backend
   */
  const refreshUser = async () => {
    try {
      await checkAuth();
      // checkAuth ya actualiza el store, solo necesitamos llamarlo
    } catch (error) {
      console.error('Error al refrescar usuario:', error);
    }
  };

  // Valor del contexto
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,
    login,
    register,
    logout,
    verifyEmail,
    resendOtp,
    refreshUser,
    clearError,
  };

  // Mostrar error de servidor si no se puede conectar
  if (initialization === 'unavailable') {
    return (
      <ServerErrorPage
        onRetry={handleRetry}
        message="No pudimos conectar con el servidor. Verifica que el backend esté ejecutándose."
      />
    );
  }

  // NO bloqueamos el render mientras se inicializa
  // Permitir que las páginas muestren sus propios skeletons
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
}
