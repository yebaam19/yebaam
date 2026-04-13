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
  register: (userData: RegisterDTO) => Promise<void>;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Sincronizar Auth con Profile Store solo tras checkAuth (evita getCurrentUser con sesión aún no hidratada)
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
    setUser,
  } = useAuthStore();

  /**
   * Inicializar autenticación al montar
   * Verifica si hay una sesión activa
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        setServerError(false);
        await checkAuth();
        setRetryCount(0); // Reset retry count on success
      } catch (error: any) {
        console.error('[AuthProvider] Error al inicializar autenticación:', error);

        // Detectar errores de conexión con el servidor
        const isConnectionError =
          error?.message?.includes('fetch failed') ||
          error?.message?.includes('ECONNREFUSED') ||
          error?.message?.includes('Network') ||
          error?.code === 'ECONNREFUSED';

        if (isConnectionError && retryCount < 3) {
          // Si es error de conexión y no hemos superado los reintentos
          console.warn(`[AuthProvider] Reintentando... (${retryCount + 1}/3)`);
          setRetryCount((prev) => prev + 1);
          // Esperar antes de reintentar (backoff exponencial)
          setTimeout(
            () => {
              initAuth();
            },
            Math.min(1000 * Math.pow(2, retryCount), 5000)
          );
          return;
        } else if (isConnectionError) {
          // Si superamos los reintentos, mostrar página de error
          setServerError(true);
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []); // Solo ejecutar una vez al montar

  /**
   * Reintentar conexión manualmente
   */
  const handleRetry = async () => {
    setIsInitialized(false);
    setServerError(false);
    setRetryCount(0);

    try {
      await checkAuth();
      setServerError(false);
    } catch (error) {
      console.error('[AuthProvider] Error en retry:', error);
      setServerError(true);
    } finally {
      setIsInitialized(true);
    }
  };

  /**
   * Refresca los datos del usuario desde el backend
   */
  const refreshUser = async () => {
    try {
      const currentUser = await checkAuth();
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
  if (serverError && isInitialized) {
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
