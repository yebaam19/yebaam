import 'server-only';
import { cache } from 'react';
import { orderedPage } from '../lib/ordered-page';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import { ABOUT_TEXT_FIELDS, type CommunityAbout, type AboutMedia } from '../types/communityAbout.types';
import type { PlanPage } from '../types/communityPlan.types';
import { institutionalUrlSchema } from '../schemas/communityAbout.schema';
import { planCursorSchema } from '../schemas/communityPlan.schema';
import { sanitizePlanContent } from './plan-content';
import { ASSET_COLUMNS } from './community-library.server';

const COLUMNS = 'id,community_id,description,history,mission,vision,objectives,values,founded_on,location,contact_email,contact_phone,website,social_links,is_published,version';

export const getCommunityAbout = cache(async (communityId: string): Promise<CommunityAbout | null> => {
  z.uuid().parse(communityId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_about').select(COLUMNS).eq('community_id', communityId).maybeSingle();
  if (error) throw new Error('No se pudo cargar la información institucional.');
  if (!data) return null;
  const about = data as CommunityAbout;
  for (const field of ABOUT_TEXT_FIELDS) about[field] = sanitizePlanContent(about[field]);
  about.website = institutionalUrlSchema.safeParse(about.website).success ? about.website : '';
  about.social_links = about.social_links.filter((link) => institutionalUrlSchema.safeParse(link.url).success)
    .map(({ label, url }) => ({ label, url }));
  return about;
});

export const getAboutMedia = cache(async (communityId: string, aboutId: string, cursorJson: string | null = null): Promise<PlanPage<AboutMedia>> => {
  z.uuid().parse(communityId); z.uuid().parse(aboutId);
  const cursor = cursorJson ? planCursorSchema.parse(JSON.parse(cursorJson)) : null;
  const client = await getServerClient();
  let query = client.from('community_about_media')
    .select(`id,community_id,about_id,asset_id,position,asset:community_library_assets!inner(${ASSET_COLUMNS})`)
    .eq('community_id', communityId).eq('about_id', aboutId).is('asset.deleted_at', null)
    .in('asset.kind', ['image', 'video']).order('position').order('id').limit(31);
  if (cursor) query = query.or(`position.gt.${cursor.position},and(position.eq.${cursor.position},id.gt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar los medios institucionales.');
  return orderedPage((data ?? []) as unknown as AboutMedia[]);
});
