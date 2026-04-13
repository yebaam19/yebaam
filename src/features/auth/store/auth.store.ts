/**
 * Auth Store
 * 
 * Store global de autenticación usando Zustand.
 * Maneja el estado del usuario autenticado y sus funciones.
 * 
 * Responsabilidades:
 * - Mantener el estado del usuario actual
 * - Proveer acciones para login, logout, register
 * - Gestionar el estado de carga y errores
 * - Sincronizar con el servicio de autenticación
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo maneja estado de autenticación
 * - Separation of Concerns: El servicio HTTP está separado
 * - Immutability: Usa Immer (incluido en Zustand) para updates inmutables
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '../services/auth.service';
import { socketManager } from '@/socket/socket-client';
import type { 
  AuthUser, 
  LoginDTO, 
  RegisterDTO,
  VerifyEmailRequest,
  ResendOtpRequest 
} from '../interfaces/auth.interfaces';

/**
 * Estado del store de autenticación
 */
interface AuthState {
  // Estado
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  login: (credentials: LoginDTO) => Promise<void>;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  register: (userData: RegisterDTO) => Promise<any>;
  logout: () => Promise<void>;
  verifyEmail: (data: VerifyEmailRequest) => Promise<void>;
  resendOtp: (data: ResendOtpRequest) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
}

/**
 * Store de autenticación
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        /**
         * Inicia sesión de usuario
         */
        login: async (credentials: LoginDTO) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authService.login(credentials);
            set({ 
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } catch (error) {
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Error al iniciar sesión'
            });
            throw error;
          }
        },

        loginWithGoogle: async (redirectTo?: string) => {
          set({ isLoading: true, error: null });
          try {
            await authService.loginWithGoogle(redirectTo);
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Error al iniciar sesión con Google',
            });
            throw error;
          }
        },

        /**
         * Registra un nuevo usuario
         * NO autentica automáticamente - el usuario debe verificar su email
         */
        register: async (userData: RegisterDTO) => {
          set({ isLoading: true, error: null });
          try {
          
            
            const response = await authService.register(userData);
            
           
            // NO autenticar - el usuario debe verificar email primero
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
            
            return response;
          } catch (error) {
            console.error('[AuthStore] Error al registrar:', error);
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Error al registrar usuario'
            });
            throw error;
          }
        },

        /**
         * Verifica el email del usuario
         */
        verifyEmail: async (data: VerifyEmailRequest) => {
          set({ isLoading: true, error: null });
          try {
            await authService.verifyEmail(data);
            set({ isLoading: false, error: null });
          } catch (error) {
            set({ 
              isLoading: false,
              error: error instanceof Error ? error.message : 'Error al verificar email'
            });
            throw error;
          }
        },

        /**
         * Reenvía el código OTP
         */
        resendOtp: async (data: ResendOtpRequest) => {
          set({ isLoading: true, error: null });
          try {
            await authService.resendOtp(data);
            set({ isLoading: false, error: null });
          } catch (error) {
            set({ 
              isLoading: false,
              error: error instanceof Error ? error.message : 'Error al reenviar OTP'
            });
            throw error;
          }
        },

        /**
         * Cierra sesión del usuario
         */
        logout: async () => {
          set({ isLoading: true });
          try {
            await authService.logout();
            
      
            socketManager.disconnectAll();
            
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
          } catch (error) {
            // Limpiar estado local incluso si falla el backend
            socketManager.disconnectAll();
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
          }
        },

        /**
         * Verifica si el usuario está autenticado
         * Útil para restaurar sesión al cargar la app
         */
        checkAuth: async () => {
          set({ isLoading: true });
          try {
            const user = await authService.getCurrentUser();
            if (user) {
              set({ user, isAuthenticated: true, isLoading: false, error: null });
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          } catch {
            set({ user: null, isAuthenticated: false, isLoading: false, error: null });
          }
        },

        /**
         * Limpia el error actual
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Establece el usuario manualmente
         * Útil para updates externos
         */
        setUser: (user: AuthUser | null) => {
          set({ 
            user,
            isAuthenticated: !!user
          });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user,
          isAuthenticated: state.isAuthenticated
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
