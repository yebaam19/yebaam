import type { PageCategory } from '../types/page.types';

// Mapeo de categorías a etiquetas en español
export const PAGE_CATEGORY_LABELS: Record<PageCategory, string> = {
  LOCAL_BUSINESS: 'Negocio Local',
  COMPANY: 'Empresa',
  BRAND: 'Marca',
  ARTIST: 'Artista',
  PUBLIC_FIGURE: 'Figura Pública',
  ENTERTAINMENT: 'Entretenimiento',
  CAUSE: 'Causa',
  COMMUNITY: 'Comunidad',
  SPORTS: 'Deportes',
  EDUCATION: 'Educación',
  NONPROFIT: 'Organización Sin Fines de Lucro',
  RELIGION: 'Religión',
  HEALTH: 'Salud',
  OTHER: 'Otro',
};

// Obtener etiqueta de categoría
export function getCategoryLabel(category: string): string {
  // Si ya viene en formato legible del backend, retornarlo directamente
  if (category.includes(' ') || category.includes('&')) {
    return category;
  }
  
  // Si viene en formato de constante (LOCAL_BUSINESS, etc), buscar en el mapa
  const mapped = PAGE_CATEGORY_LABELS[category as PageCategory];
  return mapped || category;
}

// Formatear número de seguidores
export function formatFollowersCount(count: number | undefined): string {
  if (!count || count === 0) {
    return '0';
  }
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

// Validar nombre de usuario (slug)
export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  if (!username) {
    return { isValid: false, error: 'El nombre de usuario es requerido' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Mínimo 3 caracteres' };
  }

  if (username.length > 30) {
    return { isValid: false, error: 'Máximo 30 caracteres' };
  }

  // Solo letras, números, guiones y guiones bajos
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      error: 'Solo letras, números, guiones y guiones bajos',
    };
  }

  return { isValid: true };
}

// Generar username desde nombre
export function generateUsernameFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/[^a-z0-9-_]/g, '') // Remover caracteres especiales
    .substring(0, 30); // Límite de longitud
}

// Validar email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar teléfono (formato internacional básico)
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s()-]{10,}$/;
  return phoneRegex.test(phone);
}

// Validar URL
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Obtener iniciales de nombre
export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Formatear fecha relativa
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Obtener color de badge según rol
export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-red-100 text-red-800',
    EDITOR: 'bg-blue-100 text-blue-800',
    MODERATOR: 'bg-green-100 text-green-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

// Obtener etiqueta de rol en español
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
    EDITOR: 'Editor',
    MODERATOR: 'Moderador',
  };
  return labels[role] || role;
}
