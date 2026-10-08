'use server';

import { z } from 'zod';
import type { ActionResult } from '../_shared';
import { getPlanAxes, getPlanPoints } from '../../server/community-plan.server';
import { planCursorSchema, planScopeSchema } from '../../schemas/communityPlan.schema';
import type { PlanAxis, PlanPage, PlanPoint } from '../../types/communityPlan.types';

const querySchema = planScopeSchema.extend({ cursor: planCursorSchema.nullable() });

export async function loadPlanAxes(input: unknown): Promise<ActionResult<PlanPage<PlanAxis>>> {
  const parsed = querySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'La página solicitada no es válida.' };
  try {
    const { communityId, sectionId, cursor } = parsed.data;
    return { ok: true, data: await getPlanAxes(communityId, sectionId, cursor ? JSON.stringify(cursor) : null) };
  } catch {
    return { ok: false, error: 'No se pudieron cargar los ejes. Inténtalo de nuevo.' };
  }
}

export async function loadPlanPoints(input: unknown): Promise<ActionResult<PlanPage<PlanPoint>>> {
  const parsed = querySchema.extend({ axisId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'La página solicitada no es válida.' };
  try {
    const { communityId, sectionId, axisId, cursor } = parsed.data;
    return { ok: true, data: await getPlanPoints(communityId, sectionId, axisId, cursor ? JSON.stringify(cursor) : null) };
  } catch {
    return { ok: false, error: 'No se pudieron cargar los puntos. Inténtalo de nuevo.' };
  }
}
