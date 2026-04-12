/**
 * AuthService
 * 
 * Servicio de infraestructura para la autenticación.
 * Maneja la comunicación HTTP con el backend para operaciones de auth.
 * 
 * Responsabilidades:
 * - Login/Register/Logout de usuarios
 * - Refresh de tokens
 * - Validación de sesiones
 * - Gestión de tokens en cookies
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo maneja comunicación HTTP con auth endpoints
 * - Dependency Inversion: Depende de abstracciones (AxiosInstance)
 * - Clean Code: Métodos pequeños, nombres descriptivos, manejo de errores centralizado
 */

import Cookies from 'js-cookie';
// Importar configuración de axios PRIMERO para asegurar que se inicialice
import '@/lib/axios/axiosConfig';
import { getAxiosInstance } from '@/lib/axios/axiosInstance';
import type { 
  LoginDTO, 
  RegisterDTO, 
  AuthResponseDTO,
  AuthUser, 
  MessageResponse,
  VerifyEmailRequest,
  ResendOtpRequest
} from '../interfaces/auth.interfaces';

/**
 * Endpoints del API de autenticación
 * Apuntan al backend con prefijo /api
 */
const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh-token',
  VALIDATE_SESSION: '/api/auth/validate-session',
  CURRENT_USER: '/api/auth/me',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESEND_OTP: '/api/auth/resend-otp',
} as const;

/**
 * Nombres de las cookies de autenticación
 */
const TOKEN_KEYS = {
  ACCESS: 'accessToken',
  REFRESH: 'refreshToken',
} as const;

/**
 * Opciones de cookies para producción
 */
const getCookieOptions = () => ({
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
});

export class AuthService {
  private readonly axios = getAxiosInstance();

  /**
   * Inicia sesión de un usuario
   * 
   * @param credentials - Email/username y password
   * @returns Usuario autenticado y tokens
   * @throws Error si las credenciales son inválidas
   */
  async login(credentials: LoginDTO): Promise<AuthResponseDTO> {
    try {
      const response = await this.axios.post<AuthResponseDTO>(
        AUTH_ENDPOINTS.LOGIN,
        credentials
      );

      const { accessToken, refreshToken } = response.data;
      
      // Almacenar tokens en cookies
      this.setAccessToken(accessToken);
      this.setRefreshToken(refreshToken);

      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al iniciar sesión');
    }
  }

  /**
   * Registra un nuevo usuario
   * 
   * @param userData - Datos del usuario a registrar
   * @returns Mensaje de éxito (NO devuelve tokens - usuario debe verificar email)
   * @throws Error si el registro falla
   */
  async register(userData: RegisterDTO): Promise<MessageResponse> {
    try {
      console.log('[AuthService] Registrando usuario:', {
        ...userData,
        password: '***hidden***'
      });

      const response = await this.axios.post<MessageResponse>(
        AUTH_ENDPOINTS.REGISTER,
        userData
      );

      console.log('[AuthService] Registro exitoso:', response.data);

      // NO almacenar tokens - el usuario debe verificar email primero
      // Los tokens se almacenarán después de verificar email o hacer login

      return response.data;
    } catch (error) {
      console.error('[AuthService] Error en registro:', error);
      throw this.handleError(error, 'Error al registrar usuario');
    }
  }

    /**
   * Verifica el email del usuario
   * 
   * @param verifyData - Datos para verificar el email
   * @returns Mensaje de respuesta
   * @throws Error si la verificación falla
   */
  async verifyEmail(verifyData: VerifyEmailRequest): Promise<MessageResponse> {
    try {
      const response = await this.axios.post<MessageResponse>(
        AUTH_ENDPOINTS.VERIFY_EMAIL,
        verifyData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al verificar email');
    }
  }

  /**
   * Reenvía el código OTP al email del usuario
   * 
   * @param resendData - Datos para reenviar el OTP
   * @returns Mensaje de respuesta
   * @throws Error si el reenvío falla
   */
  async resendOtp(resendData: ResendOtpRequest): Promise<MessageResponse> {
    try {
      const response = await this.axios.post<MessageResponse>(
        AUTH_ENDPOINTS.RESEND_OTP,
        resendData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Error al reenviar código OTP');
    }
  }


  /**
   * Cierra la sesión del usuario actual
   * Limpia tokens y notifica al backend
   */
  async logout(): Promise<void> {
    try {
      // Intentar notificar al backend (mejor esfuerzo)
      await this.axios.post(AUTH_ENDPOINTS.LOGOUT).catch(() => {
        // Si falla, ignorar - el cliente igual limpiará los tokens
      });
    } finally {
      // Siempre limpiar tokens locales
      this.clearAuthTokens();
    }
  }

  /**
   * Refresca el access token usando el refresh token
   * 
   * @returns Nuevo access token
   * @throws Error si el refresh token es inválido o expiró
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      const response = await this.axios.post<{ accessToken: string; refreshToken?: string }>(
        AUTH_ENDPOINTS.REFRESH_TOKEN,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Actualizar tokens
      this.setAccessToken(accessToken);
      if (newRefreshToken) {
        this.setRefreshToken(newRefreshToken);
      }

      return accessToken;
    } catch (error) {
      // Si el refresh falla, limpiar tokens
      this.clearAuthTokens();
      throw this.handleError(error, 'Error al refrescar token');
    }
  }

  /**
   * Obtiene el usuario autenticado actual desde el backend
   * 
   * @returns Usuario actual o null si no está autenticado
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      console.log('[AuthService] Obteniendo usuario actual...');
      const response = await this.axios.get<AuthUser>(AUTH_ENDPOINTS.CURRENT_USER);
      console.log('[AuthService] Usuario obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AuthService] Error al obtener usuario:', error);
      // Si falla (401, 403), retornar null en lugar de lanzar error
      if (this.isUnauthorizedError(error)) {
        return null;
      }
      throw this.handleError(error, 'Error al obtener usuario actual');
    }
  }

  /**
   * Valida si hay una sesión activa
   * 
   * @returns true si hay tokens válidos
   */
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    return !!accessToken;
  }

  // ============================================
  // Métodos privados de gestión de tokens
  // ============================================

  private setAccessToken(token: string): void {
    Cookies.set(TOKEN_KEYS.ACCESS, token, {
      ...getCookieOptions(),
      expires: 7, // 7 días
    });
  }

  private setRefreshToken(token: string): void {
    Cookies.set(TOKEN_KEYS.REFRESH, token, {
      ...getCookieOptions(),
      expires: 30, // 30 días
    });
  }

  private getAccessToken(): string | null {
    return Cookies.get(TOKEN_KEYS.ACCESS) || null;
  }

  private getRefreshToken(): string | null {
    return Cookies.get(TOKEN_KEYS.REFRESH) || null;
  }

  private clearAuthTokens(): void {
    Cookies.remove(TOKEN_KEYS.ACCESS);
    Cookies.remove(TOKEN_KEYS.REFRESH);
  }

  // ============================================
  // Métodos privados de manejo de errores
  // ============================================

  /**
   * Verifica si un error es de tipo no autorizado (401/403)
   */
  private isUnauthorizedError(error: any): boolean {
    return error?.response?.status === 401 || error?.response?.status === 403;
  }

  /**
   * Maneja errores de HTTP y los transforma en mensajes amigables
   * 
   * @param error - Error original
   * @param defaultMessage - Mensaje por defecto si no se puede extraer uno del error
   * @returns Error formateado
   */
  private handleError(error: any, defaultMessage: string): Error {
    // Si ya es un Error, retornarlo
    if (error instanceof Error && !error.message.includes('AxiosError')) {
      return error;
    }

    // Extraer mensaje del backend si está disponible
    const responseData = error?.response?.data;
    
    // Si hay errores de validación detallados, formatearlos
    if (responseData?.errors && Array.isArray(responseData.errors)) {
      const validationErrors = responseData.errors
        .map((err: any) => {
          if (Array.isArray(err.errors)) {
            return err.errors.join(', ');
          }
          return err.errors || err.message;
        })
        .filter(Boolean)
        .join('. ');
      
      if (validationErrors) {
        console.error('[AuthService] Validation errors:', validationErrors);
        return new Error(validationErrors);
      }
    }
    
    // Si hay un mensaje simple del backend
    const backendMessage = responseData?.message;
    if (backendMessage && backendMessage !== 'Validation failed') {
      return new Error(backendMessage);
    }

    // Usar mensaje por defecto
    return new Error(defaultMessage);
  }
}

/**
 * Instancia singleton del servicio de autenticación
 * Exportar para uso en toda la aplicación
 */
export const authService = new AuthService();