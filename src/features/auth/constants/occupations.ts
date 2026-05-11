// Shared source of truth for the user `occupation` slug (DB column
// `public.profiles.occupation`). Importable from both client form and
// server action/loaders — no `'use client'`/`'use server'` directive here.
// Keep in sync with migration 20260510140000_profiles_add_occupation.sql.

export const OCCUPATIONS = [
  { slug: 'estudiante', label: 'Estudiante' },
  { slug: 'comerciante', label: 'Comerciante' },
  { slug: 'empleado', label: 'Empleado' },
  { slug: 'desempleado', label: 'Desempleado' },
  { slug: 'empresario', label: 'Empresario' },
  { slug: 'profesional_independiente', label: 'Profesional Independiente' },
  { slug: 'trabajador_independiente', label: 'Trabajador Independiente' },
  { slug: 'tecnico', label: 'Técnico' },
  { slug: 'programador', label: 'Programador' },
  { slug: 'academico', label: 'Académico' },
  { slug: 'jubilado_pensionado', label: 'Jubilado / Pensionado' },
  { slug: 'funcionario_publico', label: 'Funcionario público' },
] as const;

export type OccupationSlug = (typeof OCCUPATIONS)[number]['slug'];

export const OCCUPATION_SLUGS = OCCUPATIONS.map((o) => o.slug) as readonly OccupationSlug[];

const LABEL_BY_SLUG = new Map<string, string>(OCCUPATIONS.map((o) => [o.slug, o.label]));

export function isOccupationSlug(value: unknown): value is OccupationSlug {
  return typeof value === 'string' && (OCCUPATION_SLUGS as readonly string[]).includes(value);
}

export function occupationLabel(slug: string | null | undefined): string {
  if (!slug) return '—';
  return LABEL_BY_SLUG.get(slug) ?? '—';
}
