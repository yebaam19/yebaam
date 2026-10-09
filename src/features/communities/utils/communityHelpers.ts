import { CommunityCategory, CommunityPrivacy, CommunityRole } from '../types/community.types';

/**
 * Category Labels in Spanish
 */
export const COMMUNITY_CATEGORY_LABELS: Record<CommunityCategory, string> = {
  [CommunityCategory.TECNOLOGIA]: 'Tecnología',
  [CommunityCategory.GAMING]: 'Gaming',
  [CommunityCategory.DEPORTES]: 'Deportes',
  [CommunityCategory.MUSICA]: 'Música',
  [CommunityCategory.ARTE]: 'Arte',
  [CommunityCategory.CIENCIA]: 'Ciencia',
  [CommunityCategory.EDUCACION]: 'Educación',
  [CommunityCategory.NEGOCIOS]: 'Negocios',
  [CommunityCategory.SALUD]: 'Salud',
  [CommunityCategory.LIFESTYLE]: 'Estilo de Vida',
  [CommunityCategory.VIAJES]: 'Viajes',
  [CommunityCategory.COMIDA]: 'Comida',
  [CommunityCategory.MODA]: 'Moda',
  [CommunityCategory.FOTOGRAFIA]: 'Fotografía',
  [CommunityCategory.CINE]: 'Cine',
  [CommunityCategory.LIBROS]: 'Libros',
  [CommunityCategory.POLITICA]: 'Política',
  [CommunityCategory.MEDIO_AMBIENTE]: 'Medio Ambiente',
  [CommunityCategory.ANIMALES]: 'Animales',
  [CommunityCategory.OTROS]: 'Otros',
};

/**
 * Privacy Labels in Spanish
 */
export const COMMUNITY_PRIVACY_LABELS: Record<CommunityPrivacy, string> = {
  [CommunityPrivacy.PUBLIC]: 'Pública',
  [CommunityPrivacy.PRIVATE]: 'Privada',
  [CommunityPrivacy.SECRET]: 'Secreta',
};

/**
 * Role Labels in Spanish
 */
export const COMMUNITY_ROLE_LABELS: Record<CommunityRole, string> = {
  [CommunityRole.OWNER]: 'Propietario',
  [CommunityRole.ADMIN]: 'Administrador',
  [CommunityRole.MODERATOR]: 'Moderador',
  [CommunityRole.MEMBER]: 'Miembro',
};

/**
 * Get category label in Spanish
 */
export function getCategoryLabel(category: CommunityCategory): string {
  return COMMUNITY_CATEGORY_LABELS[category] || category;
}

/**
 * Get category color for badges
 */
export const COMMUNITY_CATEGORY_BADGE_CLASS = 'bg-primary-50 text-primary-900 dark:bg-primary-900/30 dark:text-primary-200';

/**
 * Get privacy label
 */
export function getPrivacyLabel(privacy: CommunityPrivacy): string {
  return COMMUNITY_PRIVACY_LABELS[privacy] || privacy;
}

/**
 * Get privacy color for badges
 */
export function getPrivacyColor(privacy: CommunityPrivacy): string {
  const colors: Record<CommunityPrivacy, string> = {
    [CommunityPrivacy.PUBLIC]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    [CommunityPrivacy.PRIVATE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    [CommunityPrivacy.SECRET]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return colors[privacy] || colors[CommunityPrivacy.PUBLIC];
}

/**
 * Get role label
 */
export function getRoleLabel(role: CommunityRole): string {
  return COMMUNITY_ROLE_LABELS[role] || role;
}

/**
 * Get role color for badges
 */
export function getRoleColor(role: CommunityRole): string {
  const colors: Record<CommunityRole, string> = {
    [CommunityRole.OWNER]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    [CommunityRole.ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    [CommunityRole.MODERATOR]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    [CommunityRole.MEMBER]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return colors[role] || colors[CommunityRole.MEMBER];
}

/**
 * Format members count (e.g., 1234 -> 1.2K, 1234567 -> 1.2M)
 */
export function formatMembersCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format growth rate as percentage
 */
export function formatGrowthRate(rate: number): string {
  return `+${rate.toFixed(1)}%`;
}

/**
 * Generate slug from community name
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Validate community slug format
 */
export function validateCommunitySlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Hace un momento';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Hace ${diffInMonths} ${diffInMonths === 1 ? 'mes' : 'meses'}`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `Hace ${diffInYears} ${diffInYears === 1 ? 'año' : 'años'}`;
}

/**
 * Format date to locale string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if community requires approval to join
 */
export function requiresApproval(privacy: CommunityPrivacy, requireApproval: boolean): boolean {
  return privacy === CommunityPrivacy.PRIVATE || requireApproval;
}

/**
 * Get privacy icon name
 */
export function getPrivacyIcon(privacy: CommunityPrivacy): string {
  const icons: Record<CommunityPrivacy, string> = {
    [CommunityPrivacy.PUBLIC]: 'GlobeAltIcon',
    [CommunityPrivacy.PRIVATE]: 'LockClosedIcon',
    [CommunityPrivacy.SECRET]: 'EyeSlashIcon',
  };

  return icons[privacy] || icons[CommunityPrivacy.PUBLIC];
}
