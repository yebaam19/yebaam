import type { PageRole } from '@/features/pages/types/page.types';

/**
 * Roles de equipo de una Página (PDF §8 "Sistema de Usuarios"), ordenados de
 * MAYOR a MENOR privilegio. El orden es la fuente de verdad tanto para ordenar
 * la pestaña pública como para elegir el fallback de menor privilegio.
 */
export const PAGE_ROLE_ORDER: readonly PageRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'MODERATOR'];

/**
 * Roles que el propietario puede otorgar. OWNER queda fuera a propósito: la
 * propiedad vive en `pages.owner_id`, no en `page_team_members`.
 */
export const ASSIGNABLE_PAGE_ROLES: readonly PageRole[] = ['ADMIN', 'EDITOR', 'MODERATOR'];

/**
 * Etiquetas para superficies sin i18n (la pestaña pública Equipo, que sigue la
 * convención en español de sus hermanas `PageDetail*`). El panel de ajustes usa
 * el catálogo `pages.settings.roles.labels`, cuyos valores coinciden con éstos.
 */
export const PAGE_ROLE_LABELS: Record<PageRole, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  MODERATOR: 'Moderador',
};

export const PAGE_ROLE_STYLES: Record<PageRole, string> = {
  OWNER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  EDITOR: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  MODERATOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export const PAGE_ROLE_BORDERS: Record<PageRole, string> = {
  OWNER: 'border-purple-200 dark:border-purple-800',
  ADMIN: 'border-blue-200 dark:border-blue-800',
  EDITOR: 'border-green-200 dark:border-green-800',
  MODERATOR: 'border-amber-200 dark:border-amber-800',
};

/**
 * El rol llega crudo desde `page_team_members.role`, que no tiene CHECK en la
 * DB. Un valor desconocido cae al rol de MENOR privilegio: mostrar de más
 * nunca es seguro — una etiqueta "Administrador" fabricada por una fila
 * corrupta le atribuiría a esa persona autoridad que no tiene.
 */
export function normalizePageRole(role: string | null | undefined): PageRole {
  const upper = (role ?? '').trim().toUpperCase();
  return (PAGE_ROLE_ORDER as readonly string[]).includes(upper)
    ? (upper as PageRole)
    : PAGE_ROLE_ORDER[PAGE_ROLE_ORDER.length - 1];
}

export function rolePriority(role: PageRole): number {
  return PAGE_ROLE_ORDER.indexOf(role);
}
