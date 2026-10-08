import 'server-only';
import { cache } from 'react';
import { orderedPage } from '../lib/ordered-page';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import { libraryQuerySchema, libraryCursorSchema, assetKindSchema } from '../schemas/communityLibrary.schema';
import { planCursorSchema } from '../schemas/communityPlan.schema';
import type { AssetFolder, AssetKind, LibraryAsset, LibraryPage, PlanAttachment } from '../types/communityLibrary.types';

export const ASSET_COLUMNS = 'id,community_id,kind,folder_id,title,description,media_id,original_name,content_type,size_bytes,duration_seconds,uploaded_by,visibility,is_published,version,created_at';
const PAGE_SIZE = 30;

async function withUploaderNames(items: LibraryAsset[]): Promise<LibraryAsset[]> {
  const ids = [...new Set(items.flatMap((item) => item.uploaded_by ? [item.uploaded_by] : []))];
  if (!ids.length) return items;
  const client = await getServerClient();
  const { data } = await client.from('profiles').select('id,username,first_name,last_name').in('id', ids);
  // Names are supplementary and remain subject to profile RLS. A hidden or
  // deleted profile must not prevent access to an otherwise readable file.
  const names = new Map((data ?? []).map((profile) => [profile.id,
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || null]));
  return items.map((item) => ({ ...item, uploader_name: item.uploaded_by ? names.get(item.uploaded_by) ?? null : null }));
}

export const getLibraryAssets = cache(async (
  communityId: string, kind: AssetKind, folderId: string | null | undefined = undefined,
  search = '', cursorJson: string | null = null, pdfOnly = false,
): Promise<LibraryPage> => {
  const value = libraryQuerySchema.parse({ communityId, kind, folderId, search, cursor: cursorJson ? JSON.parse(cursorJson) : null });
  const client = await getServerClient();
  let query = client.from('community_library_assets').select(ASSET_COLUMNS)
    .eq('community_id', communityId).eq('kind', kind).is('deleted_at', null)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(PAGE_SIZE + 1);
  if (value.folderId === null) query = query.is('folder_id', null);
  else if (value.folderId) query = query.eq('folder_id', value.folderId);
  if (value.search) query = query.textSearch('search_vector', value.search, { type: 'websearch', config: 'simple' });
  if (pdfOnly) query = query.eq('content_type', 'application/pdf');
  if (value.cursor) query = query.or(`created_at.lt.${value.cursor.createdAt},and(created_at.eq.${value.cursor.createdAt},id.lt.${value.cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudo cargar la biblioteca.');
  const rows = (data ?? []) as LibraryAsset[];
  const items = rows.slice(0, PAGE_SIZE);
  const last = items.at(-1);
  return { items: await withUploaderNames(items), nextCursor: rows.length > PAGE_SIZE && last ? { id: last.id, createdAt: last.created_at } : null };
});

export const getLibraryAsset = cache(async (communityId: string, assetId: string): Promise<LibraryAsset | null> => {
  z.uuid().parse(communityId); z.uuid().parse(assetId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_library_assets').select(ASSET_COLUMNS)
    .eq('community_id', communityId).eq('id', assetId).is('deleted_at', null).maybeSingle();
  if (error) throw new Error('No se pudo cargar el archivo.');
  return data as LibraryAsset | null;
});

export const getAssetFolders = cache(async (communityId: string, kind: AssetKind, cursorJson: string | null = null) => {
  z.uuid().parse(communityId); assetKindSchema.parse(kind);
  const cursor = cursorJson ? libraryCursorSchema.parse(JSON.parse(cursorJson)) : null;
  const client = await getServerClient();
  let query = client.from('community_asset_folders').select('id,community_id,kind,title,is_visible,version,created_at')
    .eq('community_id', communityId).eq('kind', kind)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(PAGE_SIZE + 1);
  if (cursor) query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar las carpetas.');
  const rows = (data ?? []) as (AssetFolder & { created_at: string })[];
  const items = rows.slice(0, PAGE_SIZE);
  const last = items.at(-1);
  return { items, nextCursor: rows.length > PAGE_SIZE && last ? { id: last.id, createdAt: last.created_at } : null };
});

export const getAssetFolder = cache(async (communityId: string, folderId: string, kind: AssetKind): Promise<AssetFolder | null> => {
  z.uuid().parse(communityId); z.uuid().parse(folderId); assetKindSchema.parse(kind);
  const client = await getServerClient();
  const { data, error } = await client.from('community_asset_folders').select('id,community_id,kind,title,is_visible,version')
    .eq('community_id', communityId).eq('id', folderId).eq('kind', kind).maybeSingle();
  if (error) throw new Error('No se pudo cargar la carpeta.');
  return data as AssetFolder | null;
});

export const getPlanAttachments = cache(async (communityId: string, pointId: string, cursorJson: string | null = null) => {
  z.uuid().parse(communityId); z.uuid().parse(pointId);
  const cursor = cursorJson ? planCursorSchema.parse(JSON.parse(cursorJson)) : null;
  const client = await getServerClient();
  let query = client.from('community_plan_attachments')
    .select(`id,community_id,point_id,asset_id,position,asset:community_library_assets!inner(${ASSET_COLUMNS})`)
    .eq('community_id', communityId).eq('point_id', pointId).is('asset.deleted_at', null)
    .order('position').order('id').limit(PAGE_SIZE + 1);
  if (cursor) query = query.or(`position.gt.${cursor.position},and(position.eq.${cursor.position},id.gt.${cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar los adjuntos.');
  return orderedPage((data ?? []) as unknown as PlanAttachment[]);
});
