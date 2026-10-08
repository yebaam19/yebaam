import type { PlanCursor, PlanPage } from '../types/communityPlan.types';

/** SQL readers fetch one extra row; the cursor always belongs to a returned row. */
export function orderedPage<T extends PlanCursor>(rows: T[]): PlanPage<T> {
  const items = rows.slice(0, 30);
  const last = items.at(-1);
  return { items, nextCursor: rows.length > 30 && last ? { id: last.id, position: last.position } : null };
}
