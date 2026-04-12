/**
 * Avatar Utilities
 * 
 * Helpers para manejar URLs de avatares con fallback
 * durante la migración de `avatar` → `avatarUrl`
 */

import type { AuthUser } from '@/features/auth/interfaces/auth.interfaces';

/**
 * Obtiene la URL del avatar del usuario con fallback
 * 
 * @param user - Usuario autenticado
 * @returns URL del avatar o undefined
 */
export function getUserAvatarUrl(user: AuthUser | null | undefined): string | undefined {
  if (!user) return undefined;
  
  // Priorizar avatarUrl (nuevo formato), fallback a avatar (legacy)
  return user.avatarUrl || user.avatar || undefined;
}

/**
 * Obtiene la URL de la foto de portada del usuario
 * 
 * @param user - Usuario autenticado
 * @returns URL de la portada o undefined
 */
export function getUserCoverUrl(user: AuthUser | null | undefined): string | undefined {
  if (!user) return undefined;
  
  return user.coverPhotoUrl || undefined;
}
