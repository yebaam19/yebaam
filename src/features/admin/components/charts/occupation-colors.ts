import type { OccupationSlug } from '@/features/auth/constants/occupations';

export const OCCUPATION_COLOR: Record<OccupationSlug | 'unknown', string> = {
  estudiante: '#3b82f6',
  comerciante: '#f97316',
  empleado: '#10b981',
  empresario: '#ef4444',
  profesional_independiente: '#8b5cf6',
  trabajador_independiente: '#06b6d4',
  tecnico: '#f59e0b',
  programador: '#22c55e',
  academico: '#ec4899',
  jubilado_pensionado: '#64748b',
  funcionario_publico: '#a855f7',
  unknown: '#cbd5e1',
};

export function colorForSlug(slug: string | null): string {
  if (!slug) return OCCUPATION_COLOR.unknown;
  return OCCUPATION_COLOR[slug as OccupationSlug] ?? OCCUPATION_COLOR.unknown;
}
