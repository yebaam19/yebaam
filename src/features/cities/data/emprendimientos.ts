/**
 * Shared emprendimientos constants — framework-agnostic (no 'server-only',
 * no 'use client') so both the server reads and the client islands
 * (toolbar chips, category picker) can import them.
 */

export const EMPRENDIMIENTO_CATEGORIES = [
  'comida',
  'ropa',
  'servicios',
  'tecnologia',
  'artesanias',
  'belleza',
  'hogar',
  'otro',
] as const;
export type EmprendimientoCategory = (typeof EMPRENDIMIENTO_CATEGORIES)[number];

export type EmprendimientoStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
