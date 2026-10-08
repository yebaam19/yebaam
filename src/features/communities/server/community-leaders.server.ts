import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import { leaderQuerySchema } from '../schemas/communityLeader.schema';
import { institutionalUrlSchema } from '../schemas/communityAbout.schema';
import type { LeaderCategory, LeaderSummary, CommunityLeader, LeaderContacts, LeaderMedia } from '../types/communityLeader.types';
import type { PlanPage } from '../types/communityPlan.types';
import { ASSET_COLUMNS } from './community-library.server';
import { sanitizePlanContent } from './plan-content';
import { orderedPage } from '../lib/ordered-page';

const SUMMARY_COLUMNS = 'id,community_id,section_id,category_id,full_name,responsibility,position,is_published,version';
const MEDIA_COLUMNS = `id,community_id,leader_id,slot,asset_id,version,asset:community_library_assets(${ASSET_COLUMNS},deleted_at)`;
export const getLeaderCategory = cache(async (communityId: string, categoryId: string): Promise<LeaderCategory | null> => {
  z.uuid().parse(communityId); z.uuid().parse(categoryId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_leader_categories').select('id,community_id,section_id,title,position,is_published,version')
    .eq('community_id', communityId).eq('id', categoryId).maybeSingle();
  if (error) throw new Error('No se pudo cargar la categoría.');
  return data as LeaderCategory | null;
});
function readableMedia(rows: unknown): LeaderMedia[] {
  return (rows as (LeaderMedia & { asset: (NonNullable<LeaderMedia['asset']> & { deleted_at?: string | null }) | null })[])
    .map((row) => {
      if (!row.asset || row.asset.deleted_at) return { ...row, asset: null };
      const asset = { ...row.asset };
      delete asset.deleted_at;
      return { ...row, asset };
    });
}

export const getLeaderCategories = cache(async (communityId: string, sectionId: string, cursorJson: string | null = null) => {
  const { cursor } = leaderQuerySchema.parse({ communityId, sectionId, cursor: cursorJson ? JSON.parse(cursorJson) : null });
  const client = await getServerClient();
  let query = client.from('community_leader_categories').select('id,community_id,section_id,title,position,is_published,version')
    .eq('community_id', communityId).eq('section_id', sectionId).order('position').order('id').limit(31);
  if (cursor) query = query.or(`position.gt.${cursor.position},and(position.eq.${cursor.position},id.gt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar las categorías.');
  return orderedPage((data ?? []) as LeaderCategory[]);
});

export const getCommunityLeaders = cache(async (
  communityId: string, sectionId: string, categoryId: string | null | undefined = undefined, cursorJson: string | null = null,
): Promise<PlanPage<LeaderSummary>> => {
  const { cursor } = leaderQuerySchema.parse({ communityId, sectionId, categoryId, cursor: cursorJson ? JSON.parse(cursorJson) : null });
  const client = await getServerClient();
  let query = client.from('community_leaders').select(SUMMARY_COLUMNS).eq('community_id', communityId).eq('section_id', sectionId)
    .order('position').order('id').limit(31);
  if (categoryId !== undefined) query = categoryId === null ? query.is('category_id', null) : query.eq('category_id', categoryId);
  if (cursor) query = query.or(`position.gt.${cursor.position},and(position.eq.${cursor.position},id.gt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar los integrantes.');
  const page = orderedPage((data ?? []) as LeaderSummary[]);
  if (!page.items.length) return page;
  const { data: media, error: mediaError } = await client.from('community_leader_media').select(MEDIA_COLUMNS)
    .eq('community_id', communityId).eq('slot', 'portrait').in('leader_id', page.items.map((item) => item.id)).limit(30);
  if (mediaError) throw new Error('No se pudieron cargar las fotografías.');
  const portraits = new Map(readableMedia(media ?? []).map((row) => [row.leader_id, row]));
  return { ...page, items: page.items.map((item) => ({ ...item, portrait: portraits.get(item.id) ?? null })) };
});

export const getCommunityLeader = cache(async (communityId: string, leaderId: string): Promise<CommunityLeader | null> => {
  z.uuid().parse(communityId); z.uuid().parse(leaderId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_leaders').select(`${SUMMARY_COLUMNS},biography,trajectory`)
    .eq('community_id', communityId).eq('id', leaderId).maybeSingle();
  if (error) throw new Error('No se pudo cargar la ficha.');
  if (!data) return null;
  return { ...data, biography: sanitizePlanContent(data.biography), trajectory: sanitizePlanContent(data.trajectory) } as CommunityLeader;
});

export const getLeaderContacts = cache(async (communityId: string, leaderId: string): Promise<LeaderContacts | null> => {
  z.uuid().parse(communityId); z.uuid().parse(leaderId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_leader_contacts')
    .select('id,community_id,email,phone,social_links,profile_id,is_public,version')
    .eq('community_id', communityId).eq('id', leaderId).maybeSingle();
  if (error) throw new Error('No se pudo cargar el contacto.');
  if (!data) return null;
  const contacts = data as LeaderContacts;
  const profile = contacts.profile_id ? await client.from('profiles').select('username').eq('id', contacts.profile_id).maybeSingle() : null;
  if (profile?.error) throw new Error('No se pudo comprobar el perfil vinculado.');
  return { ...contacts, profile_username: profile?.data?.username ?? null,
    social_links: contacts.social_links.filter((link) => institutionalUrlSchema.safeParse(link.url).success)
      .map(({ label, url }) => ({ label, url })) };
});

export const getLeaderMedia = cache(async (communityId: string, leaderId: string): Promise<LeaderMedia[]> => {
  z.uuid().parse(communityId); z.uuid().parse(leaderId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_leader_media').select(MEDIA_COLUMNS)
    .eq('community_id', communityId).eq('leader_id', leaderId).order('slot').limit(3);
  if (error) throw new Error('No se pudieron cargar los medios de la ficha.');
  return readableMedia(data ?? []);
});
