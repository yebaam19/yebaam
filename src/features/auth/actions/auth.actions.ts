/**
 * Server Actions para autenticación
 * Solo se ejecutan en el servidor (Next.js Server Components)
 */

import { cookies } from 'next/headers';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

/**
 * Obtiene el usuario autenticado desde el servidor
 * Esta función solo se puede llamar desde Server Components
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return null;
    }

    // Timeout para evitar esperas infinitas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos

    try {
      // Llamar al endpoint /api/auth/me del backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // No cachear para obtener datos frescos
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Si es 401, el token es inválido
        if (response.status === 401) {
          console.warn('[Auth] Token inválido o expirado');
        }
        return null;
      }

      const authUser = await response.json();
      
      // Mapear AuthUser del backend a User del frontend
      // Extraer nombre del email para generar displayName temporal
      const emailName = authUser.email?.split('@')[0] || 'User';
      
      return {
        id: authUser.id,
        username: emailName,
        displayName: emailName,
        avatarUrl: authUser.avatar || null,
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Errores de conexión (servidor caído, timeout, etc.)
      if (fetchError.name === 'AbortError') {
        console.error('[Auth] Timeout al conectar con el servidor');
      } else if (fetchError.cause?.code === 'ECONNREFUSED') {
        console.error('[Auth] Servidor no disponible (ECONNREFUSED)');
      } else {
        console.error('[Auth] Error de red:', fetchError.message);
      }
      
      // Retornar null para que la app continúe sin auth
      return null;
    }
  } catch (error) {
    console.error('[Auth] Error inesperado en getAuthUser:', error);
    return null;
  }
}
