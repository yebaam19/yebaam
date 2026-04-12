import type { ClubCategory, MembershipTier, ClubRole } from '../types/club.types';

/**
 * Mapeo de categorías a etiquetas en español
 */
export const CLUB_CATEGORY_LABELS: Record<ClubCategory, string> = {
  DEPORTES: 'Deportes',
  CULTURAL: 'Cultural',
  PROFESIONAL: 'Profesional',
  EDUCATIVO: 'Educativo',
  SOCIAL: 'Social',
  GAMING: 'Gaming',
  TECNOLOGIA: 'Tecnología',
  ARTE: 'Arte',
  MUSICA: 'Música',
  LIBRO: 'Libros',
  CINE: 'Cine',
  GASTRONOMIA: 'Gastronomía',
  VIAJES: 'Viajes',
  BIENESTAR: 'Bienestar',
  NEGOCIOS: 'Negocios',
  OTRO: 'Otro',
};

/**
 * Mapeo de membership tiers a etiquetas en español
 */
export const MEMBERSHIP_TIER_LABELS: Record<MembershipTier, string> = {
  FREE: 'Gratis',
  BASIC: 'Básico',
  PREMIUM: 'Premium',
  VIP: 'VIP',
};

/**
 * Mapeo de roles a etiquetas en español
 */
export const CLUB_ROLE_LABELS: Record<ClubRole, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MODERATOR: 'Moderador',
  MEMBER: 'Miembro',
};

/**
 * Obtener etiqueta de categoría
 */
export function getCategoryLabel(category: ClubCategory): string {
  return CLUB_CATEGORY_LABELS[category] || category;
}

/**
 * Obtener etiqueta de membership tier
 */
export function getMembershipTierLabel(tier: MembershipTier): string {
  return MEMBERSHIP_TIER_LABELS[tier] || tier;
}

/**
 * Obtener etiqueta de rol
 */
export function getRoleLabel(role: ClubRole): string {
  return CLUB_ROLE_LABELS[role] || role;
}

/**
 * Formatear número de miembros
 */
export function formatMembersCount(count: number | undefined): string {
  if (!count) return '0';
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Formatear tasa de crecimiento
 */
export function formatGrowthRate(rate: number | undefined): string {
  if (!rate) return '0%';
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}%`;
}

/**
 * Obtener color del rol
 */
export function getRoleColor(role: ClubRole): string {
  const colors: Record<ClubRole, string> = {
    OWNER: 'text-purple-600 dark:text-purple-400',
    ADMIN: 'text-blue-600 dark:text-blue-400',
    MODERATOR: 'text-green-600 dark:text-green-400',
    MEMBER: 'text-gray-600 dark:text-gray-400',
  };
  return colors[role] || colors.MEMBER;
}

/**
 * Obtener color del membership tier
 */
export function getTierColor(tier: MembershipTier): string {
  const colors: Record<MembershipTier, string> = {
    FREE: 'text-gray-600 dark:text-gray-400',
    BASIC: 'text-blue-600 dark:text-blue-400',
    PREMIUM: 'text-yellow-600 dark:text-yellow-400',
    VIP: 'text-purple-600 dark:text-purple-400',
  };
  return colors[tier] || colors.FREE;
}

/**
 * Obtener badge color del membership tier
 */
export function getTierBadgeColor(tier: MembershipTier): string {
  const colors: Record<MembershipTier, string> = {
    FREE: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    BASIC: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    PREMIUM: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    VIP: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  };
  return colors[tier] || colors.FREE;
}

/**
 * Obtener color de categoría
 */
export function getCategoryColor(category: ClubCategory): string {
  const colors: Partial<Record<ClubCategory, string>> = {
    DEPORTES: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    CULTURAL: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    PROFESIONAL: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    EDUCATIVO: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    SOCIAL: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
    GAMING: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
    TECNOLOGIA: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300',
    ARTE: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
    MUSICA: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  };
  return colors[category] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
}

/**
 * Validar slug del club
 */
export function validateClubSlug(slug: string): boolean {
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return regex.test(slug);
}

/**
 * Generar slug desde nombre
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

/**
 * Truncar texto
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Obtener tiempo relativo (hace X tiempo)
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 2592000) return `Hace ${Math.floor(diffInSeconds / 604800)}sem`;
  if (diffInSeconds < 31536000) return `Hace ${Math.floor(diffInSeconds / 2592000)}m`;
  return `Hace ${Math.floor(diffInSeconds / 31536000)}a`;
}

/**
 * Formatear fecha completa
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Formatear fecha y hora
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
