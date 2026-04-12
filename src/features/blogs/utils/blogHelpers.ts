import type { BlogCategory } from '../types/blog.types';

export const BLOG_CATEGORY_LABELS: Record<BlogCategory, string> = {
  TECNOLOGIA: 'Tecnología',
  NEGOCIOS: 'Negocios',
  LIFESTYLE: 'Lifestyle',
  VIAJES: 'Viajes',
  GASTRONOMIA: 'Gastronomía',
  MODA: 'Moda',
  DEPORTES: 'Deportes',
  SALUD: 'Salud',
  CIENCIA: 'Ciencia',
  ARTE: 'Arte',
  MUSICA: 'Música',
  CINE: 'Cine',
  LIBROS: 'Libros',
  EDUCACION: 'Educación',
  FINANZAS: 'Finanzas',
  MARKETING: 'Marketing',
  DISEÑO: 'Diseño',
  FOTOGRAFIA: 'Fotografía',
  DESARROLLO_PERSONAL: 'Desarrollo Personal',
  OTRO: 'Otro',
};

export function getCategoryLabel(category: BlogCategory): string {
  return BLOG_CATEGORY_LABELS[category] || category;
}

export function getCategoryColor(category: BlogCategory): string {
  const colors: Partial<Record<BlogCategory, string>> = {
    TECNOLOGIA: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    NEGOCIOS: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    LIFESTYLE: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
    VIAJES: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    GASTRONOMIA: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
    MODA: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DEPORTES: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    SALUD: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300',
    CIENCIA: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
  };
  return colors[category] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
}

export function formatFollowersCount(count: number | undefined): string {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function formatViewsCount(count: number | undefined): string {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function formatReadTime(minutes: number): string {
  return `${minutes} min de lectura`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
