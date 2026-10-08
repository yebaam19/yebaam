import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { relatedLinkScopeSchema } from '../schemas/communityRelatedLink.schema';
import type { CommunityRelatedLink, RelatedLinkCursor, RelatedLinkPage } from '../types/communityRelatedLink.types';

const PAGE_SIZE = 24;
const COLUMNS = 'id,community_id,title,description,href,image_asset_id,position,is_published,version';
type LinkRow = Omit<CommunityRelatedLink, 'image'>;
type ImageRow = { id: string; title: string; media_id: string };

export const getCommunityRelatedLinks = cache(async (
  communityId: string, cursorJson: string | null = null,
): Promise<RelatedLinkPage> => {
  const { cursor } = relatedLinkScopeSchema.parse({ communityId, cursor: cursorJson ? JSON.parse(cursorJson) : null });
  const client = await getServerClient();
  let query = client.from('community_related_links').select(COLUMNS).eq('community_id', communityId)
    .is('deleted_at', null).order('position').order('id').limit(PAGE_SIZE + 1);
  if (cursor) query = query.or(`position.gt.${cursor.position},and(position.eq.${cursor.position},id.gt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar las páginas relacionadas.');
  const rows = (data ?? []) as LinkRow[];
  const page = rows.slice(0, PAGE_SIZE);
  const ids = [...new Set(page.flatMap((item) => item.image_asset_id ? [item.image_asset_id] : []))];
  const { data: images, error: imageError } = ids.length
    ? await client.from('community_library_assets').select('id,title,media_id').eq('community_id', communityId)
      .eq('kind', 'image').is('deleted_at', null).in('id', ids)
    : { data: [], error: null };
  if (imageError) throw new Error('No se pudieron cargar las imágenes de los enlaces.');
  const byId = new Map(((images ?? []) as ImageRow[]).map((item) => [item.id, item]));
  const last = page.at(-1);
  const nextCursor: RelatedLinkCursor | null = rows.length > PAGE_SIZE && last
    ? { position: last.position, id: last.id } : null;
  return { items: page.map((item) => ({ ...item, image: item.image_asset_id ? byId.get(item.image_asset_id) ?? null : null })), nextCursor };
});
