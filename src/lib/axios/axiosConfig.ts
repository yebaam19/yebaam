/**
 * axiosConfig.ts
 * 
 * Configuración e inicialización de Axios a nivel de módulo.
 * Este archivo se ejecuta de forma sincrónica cuando se importa,
 * http://localhost:3001/api/auth/me
 * asegurando que axios esté configurado antes de cualquier uso.
 */

import Cookies from 'js-cookie';
import { initAxios, getAxiosInstance } from './axiosInstance';

// Solo ejecutar en el cliente (navegador)
if (typeof window !== 'undefined') {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
 
  initAxios({
    baseURL,
    tokenProvider: {
      getAccessToken: () => {
        const token = Cookies.get('accessToken') || null;
        return token;
      },
      getRefreshToken: () => {
        const token = Cookies.get('refreshToken') || null;
        return token;
      },
      setTokens: (accessToken, refreshToken) => {
        if (accessToken) {
          Cookies.set('accessToken', accessToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: 7,
          });
        }
        if (refreshToken) {
          Cookies.set('refreshToken', refreshToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: 7,
          });
        }
        if (refreshToken) {
          Cookies.set('refreshToken', refreshToken, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: 30,
          });
        }
      },
    },
    interceptorOptions: {
      refreshEndpoint: '/auth/refresh-token',
      onRefreshError: (error) => {

        const status = error.response?.status;
        if (status === 401 || status === 403) {
         
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          window.location.href = '/';
        }
      },
    },
  });
  

}

/**
 * Re-exportar instancia de axios para uso en toda la aplicación
 */
export { getAxiosInstance } from './axiosInstance';
