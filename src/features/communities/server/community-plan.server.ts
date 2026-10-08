import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import { sanitizePlanContent } from './plan-content';
import { getAttachmentPreviews } from './community-attachments.server';
import { planCursorSchema, planScopeSchema } from '../schemas/communityPlan.schema';
import type {
  CommunitySection, PlanAxis, PlanCursor, PlanPage, PlanPoint, ProfileCapabilities,
} from '../types/communityPlan.types';

const SECTION_COLUMNS = 'id,community_id,kind,title,position,is_visible,version';
const AXIS_COLUMNS = 'id,community_id,section_id,title,description,position,is_published,version';
const PAGE_SIZE = 30;

export const usesStructuredRules = cache(async (communityId: string): Promise<boolean> => {
  z.uuid().parse(communityId);
  const client = await getServerClient();
  const { data, error } = await client.rpc('community_uses_structured_rules', { target_community: communityId });
  if (error) throw new Error('No se pudo cargar el reglamento.');
  return data === true;
});

// Request-local memoization only: RLS-visible drafts must never enter shared caches.
export const getCommunitySections = cache(async (communityId: string): Promise<CommunitySection[]> => {
  z.uuid().parse(communityId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_sections').select(SECTION_COLUMNS)
    .eq('community_id', communityId).order('position').order('id').limit(5);
  if (error) throw new Error('No se pudieron cargar las secciones.');
  return (data ?? []) as CommunitySection[];
});

export const getCommunityProfileCapabilities = cache(async (communityId: string): Promise<ProfileCapabilities> => {
  z.uuid().parse(communityId);
  const client = await getServerClient();
  const { data, error } = await client.rpc('community_profile_capabilities', { target_community: communityId });
  if (error) throw new Error('No se pudieron comprobar los permisos.');
  return data as ProfileCapabilities;
});

function pageOf<T extends PlanCursor>(rows: T[]): PlanPage<T> {
  const items = rows.slice(0, PAGE_SIZE);
  const last = items.at(-1);
  return {
    items,
    nextCursor: rows.length > PAGE_SIZE && last ? { position: last.position, id: last.id } : null,
  };
}

// Primitive arguments preserve React.cache deduplication across layout/page reads.
export const getPlanAxes = cache(async (
  communityId: string, sectionId: string, cursorJson: string | null = null,
): Promise<PlanPage<PlanAxis>> => {
  planScopeSchema.parse({ communityId, sectionId });
  const cursor = cursorJson ? planCursorSchema.parse(JSON.parse(cursorJson)) : null;
  const client = await getServerClient();
  let query = client.from('community_plan_axes').select(AXIS_COLUMNS)
    .eq('community_id', communityId).eq('section_id', sectionId)
    .order('position').order('id').limit(PAGE_SIZE + 1);
  if (cursor) query = query.or(`position.gt.${cursor.position},and(position.eq.${cursor.position},id.gt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar los ejes.');
  return pageOf((data ?? []) as PlanAxis[]);
});

export const getPlanAxis = cache(async (
  communityId: string, sectionId: string, axisId: string,
): Promise<PlanAxis | null> => {
  planScopeSchema.parse({ communityId, sectionId });
  z.uuid().parse(axisId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_plan_axes').select(AXIS_COLUMNS)
    .eq('community_id', communityId).eq('section_id', sectionId).eq('id', axisId).maybeSingle();
  if (error) throw new Error('No se pudo cargar el eje.');
  return data as PlanAxis | null;
});

export const getPlanPoints = cache(async (
  communityId: string, sectionId: string, axisId: string, cursorJson: string | null = null,
): Promise<PlanPage<PlanPoint>> => {
  planScopeSchema.parse({ communityId, sectionId });
  z.uuid().parse(axisId);
  const cursor = cursorJson ? planCursorSchema.parse(JSON.parse(cursorJson)) : null;
  const client = await getServerClient();
  let query = client.from('community_plan_points').select(`${AXIS_COLUMNS},axis_id,content`)
    .eq('community_id', communityId).eq('section_id', sectionId).eq('axis_id', axisId)
    .order('position').order('id').limit(PAGE_SIZE + 1);
  if (cursor) query = query.or(`position.gt.${cursor.position},and(position.eq.${cursor.position},id.gt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar los puntos.');
  const page = pageOf((data ?? []) as PlanPoint[]);
  const previews = await getAttachmentPreviews(communityId, JSON.stringify(page.items.map((point) => point.id)));
  return { ...page, items: page.items.map((point) => ({
    ...point, content: sanitizePlanContent(point.content),
    attachments: previews.get(point.id) ?? { items: [], nextCursor: null },
  })) };
});
