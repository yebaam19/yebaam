import type { PlanKind } from '../types/communityPlan.types';

export const PLAN_KINDS: PlanKind[] = ['rules', 'government', 'economy'];

export function planPath(slug: string, kind: PlanKind): string {
  const base = `/feed/comunidades/${encodeURIComponent(slug)}`;
  return kind === 'rules' ? `${base}/reglas` : `${base}/planes/${kind}`;
}

export function axisPath(base: string, axisId: string): string {
  return `${base}?eje=${encodeURIComponent(axisId)}`;
}
