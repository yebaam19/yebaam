'use server';

import { leaderQuerySchema } from '../../schemas/communityLeader.schema';
import { getCommunityLeaders, getLeaderCategories } from '../../server/community-leaders.server';
import type { ActionResult } from '../_shared';
import type { PlanPage } from '../../types/communityPlan.types';
import type { LeaderCategory, LeaderSummary } from '../../types/communityLeader.types';

export async function loadCommunityLeaders(input: unknown): Promise<ActionResult<PlanPage<LeaderSummary>>> {
  const parsed = leaderQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'La página no es válida.' };
  try {
    const { communityId, sectionId, categoryId, cursor } = parsed.data;
    return { ok: true, data: await getCommunityLeaders(communityId, sectionId, categoryId, cursor ? JSON.stringify(cursor) : null) };
  } catch { return { ok: false, error: 'No se pudieron cargar los integrantes. Inténtalo de nuevo.' }; }
}
export async function loadLeaderCategories(input: unknown): Promise<ActionResult<PlanPage<LeaderCategory>>> {
  const parsed = leaderQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'La página no es válida.' };
  try {
    const { communityId, sectionId, cursor } = parsed.data;
    return { ok: true, data: await getLeaderCategories(communityId, sectionId, cursor ? JSON.stringify(cursor) : null) };
  } catch { return { ok: false, error: 'No se pudieron cargar las categorías. Inténtalo de nuevo.' }; }
}
