'use server';

import { z } from 'zod';
import { planCursorSchema } from '../../schemas/communityPlan.schema';
import { getAboutMedia } from '../../server/community-about.server';
import type { ActionResult } from '../_shared';
import type { AboutMedia } from '../../types/communityAbout.types';
import type { PlanPage } from '../../types/communityPlan.types';

export async function loadAboutMedia(input: unknown): Promise<ActionResult<PlanPage<AboutMedia>>> {
  const parsed = z.object({ communityId: z.uuid(), aboutId: z.uuid(), cursor: planCursorSchema.nullable() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'La página no es válida.' };
  try {
    const { communityId, aboutId, cursor } = parsed.data;
    return { ok: true, data: await getAboutMedia(communityId, aboutId, cursor ? JSON.stringify(cursor) : null) };
  } catch { return { ok: false, error: 'No se pudieron cargar los medios. Inténtalo de nuevo.' }; }
}
