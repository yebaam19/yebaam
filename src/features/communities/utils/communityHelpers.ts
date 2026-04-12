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
export function getCategoryColor(category: CommunityCategory): string {
  const colors: Record<CommunityCategory, string> = {
    [CommunityCategory.TECNOLOGIA]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    [CommunityCategory.GAMING]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    [CommunityCategory.DEPORTES]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    [CommunityCategory.MUSICA]: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    [CommunityCategory.ARTE]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    [CommunityCategory.CIENCIA]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    [CommunityCategory.EDUCACION]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    [CommunityCategory.NEGOCIOS]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    [CommunityCategory.SALUD]: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    [CommunityCategory.LIFESTYLE]: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    [CommunityCategory.VIAJES]: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    [CommunityCategory.COMIDA]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    [CommunityCategory.MODA]: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
    [CommunityCategory.FOTOGRAFIA]: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    [CommunityCategory.CINE]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    [CommunityCategory.LIBROS]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    [CommunityCategory.POLITICA]: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    [CommunityCategory.MEDIO_AMBIENTE]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    [CommunityCategory.ANIMALES]: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
    [CommunityCategory.OTROS]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return colors[category] || colors[CommunityCategory.OTROS];
}

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
