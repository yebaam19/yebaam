import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import { getUserDisplayName } from '@/lib/user-helpers';
import { cfImageUrl } from './cf';
import {
  EMPRENDIMIENTO_CATEGORIES,
  type EmprendimientoCategory,
  type EmprendimientoStatus,
} from '../data/emprendimientos';

/**
 * RSC-friendly reads for City Emprendimientos (PDF "Emprendimientos" —
 * espacio para pequeños emprendedores informales).
 *
 * Visibility is enforced by RLS: the public only ever sees APPROVED rows;
 * owners and platform admins see their own regardless of status. The
 * fetchers still filter `.eq('status','APPROVED')` on public lists as
 * belt-and-braces so a future policy change cannot silently widen them.
 */

export { EMPRENDIMIENTO_CATEGORIES };
export type { EmprendimientoCategory, EmprendimientoStatus };

export interface EmprendimientoMediaItem {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  cfImageId: string | null;
  cfStreamUid: string | null;
  imageUrl?: string;
  caption: string | null;
  position: number;
}

export interface EmprendimientoSummary {
  id: string;
  cityId: string;
  ownerId: string;
  name: string;
  shortDescription: string;
  category: EmprendimientoCategory;
  zone: string | null;
  status: EmprendimientoStatus;
  heroImageUrl?: string;
  recommendationsCount: number;
  createdAt: string;
}

export interface EmprendimientoDetail extends EmprendimientoSummary {
  story: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  heroCfImageId: string | null;
  ownerCfImageId: string | null;
  ownerPhotoUrl?: string;
  ownerName: string;
  rejectionReason: string | null;
  verifiedAt: string | null;
  media: EmprendimientoMediaItem[];
}

type EmprendimientoRow = {
  id: string;
  city_id: string;
  owner_id: string;
  name: string;
  short_description: string;
  story: string | null;
  category: string;
  zone: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  hero_cf_image_id: string | null;
  owner_cf_image_id: string | null;
  status: string;
  rejection_reason: string | null;
  verified_at: string | null;
  recommendations_count: number;
  created_at: string;
};

const EMPRENDIMIENTO_SELECT =
  'id, city_id, owner_id, name, short_description, story, category, zone, address, phone, whatsapp, hero_cf_image_id, owner_cf_image_id, status, rejection_reason, verified_at, recommendations_count, created_at';

function toSummary(row: EmprendimientoRow): EmprendimientoSummary {
  return {
    id: row.id,
    cityId: row.city_id,
    ownerId: row.owner_id,
    name: row.name,
    shortDescription: row.short_description,
    category: row.category as EmprendimientoCategory,
    zone: row.zone,
    status: row.status as EmprendimientoStatus,
    heroImageUrl: cfImageUrl(row.hero_cf_image_id),
    recommendationsCount: row.recommendations_count,
    createdAt: row.created_at,
  };
}

export interface EmprendimientosQueryOpts {
  category?: EmprendimientoCategory;
  /** Free-text search over `name` and `short_description`. */
  q?: string;
  limit: number;
  offset: number;
}

export async function fetchApprovedEmprendimientos(
  client: SupabaseClient,
  cityId: string,
  opts: EmprendimientosQueryOpts,
): Promise<EmprendimientoSummary[]> {
  let q = client
    .from('city_emprendimientos')
    .select(EMPRENDIMIENTO_SELECT)
    .eq('city_id', cityId)
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false })
    .range(opts.offset, opts.offset + Math.max(opts.limit - 1, 0));

  if (opts.category) {
    q = q.eq('category', opts.category);
  }
  const term = opts.q?.trim();
  if (term) {
    // PostgREST or-filter values: escape commas/parens by dropping them.
    const safe = term.replace(/[,()]/g, ' ').trim();
    if (safe) {
      q = q.or(`name.ilike.%${safe}%,short_description.ilike.%${safe}%`);
    }
  }

  const { data, error } = await q;
  if (error) {
    console.error('[fetchApprovedEmprendimientos]', error);
    return [];
  }
  return (data ?? []).map((r) => toSummary(r as unknown as EmprendimientoRow));
}

export async function fetchEmprendimientoById(
  client: SupabaseClient,
  id: string,
): Promise<EmprendimientoDetail | null> {
  const { data, error } = await client
    .from('city_emprendimientos')
    .select(EMPRENDIMIENTO_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('[fetchEmprendimientoById]', error);
    return null;
  }
  if (!data) return null;
  const row = data as unknown as EmprendimientoRow;

  const [{ data: mediaRows }, { data: profile }] = await Promise.all([
    client
      .from('city_emprendimiento_media')
      .select('id, type, cf_image_id, cf_stream_uid, caption, position')
      .eq('emprendimiento_id', row.id)
      .order('position', { ascending: true }),
    client
      .from('profiles')
      .select('username, display_name, first_name, last_name')
      .eq('id', row.owner_id)
      .maybeSingle(),
  ]);

  type MediaRow = {
    id: string;
    type: 'IMAGE' | 'VIDEO';
    cf_image_id: string | null;
    cf_stream_uid: string | null;
    caption: string | null;
    position: number;
  };
  type ProfileRow = {
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  const p = profile as ProfileRow | null;

  return {
    ...toSummary(row),
    story: row.story,
    address: row.address,
    phone: row.phone,
    whatsapp: row.whatsapp,
    heroCfImageId: row.hero_cf_image_id,
    ownerCfImageId: row.owner_cf_image_id,
    ownerPhotoUrl: cfImageUrl(row.owner_cf_image_id),
    ownerName: getUserDisplayName({
      firstName: p?.first_name,
      lastName: p?.last_name,
      displayName: p?.display_name,
      username: p?.username,
    }),
    rejectionReason: row.rejection_reason,
    verifiedAt: row.verified_at,
    media: ((mediaRows ?? []) as MediaRow[]).map((m) => ({
      id: m.id,
      type: m.type,
      cfImageId: m.cf_image_id,
      cfStreamUid: m.cf_stream_uid,
      imageUrl: cfImageUrl(m.cf_image_id),
      caption: m.caption,
      position: m.position,
    })),
  };
}

/** Owner's rows in one city, any status — feeds the "en revisión" banner. */
export async function fetchMyEmprendimientos(
  client: SupabaseClient,
  cityId: string,
  userId: string,
): Promise<EmprendimientoSummary[]> {
  const { data, error } = await client
    .from('city_emprendimientos')
    .select(EMPRENDIMIENTO_SELECT)
    .eq('city_id', cityId)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[fetchMyEmprendimientos]', error);
    return [];
  }
  return (data ?? []).map((r) => toSummary(r as unknown as EmprendimientoRow));
}

export async function fetchHasRecommended(
  client: SupabaseClient,
  emprendimientoId: string,
  userId: string,
): Promise<boolean> {
  const { count, error } = await client
    .from('city_emprendimiento_recommendations')
    .select('emprendimiento_id', { count: 'exact', head: true })
    .eq('emprendimiento_id', emprendimientoId)
    .eq('user_id', userId);
  if (error) {
    console.error('[fetchHasRecommended]', error);
    return false;
  }
  return (count ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Cached request-scoped wrappers — only safe inside an RSC / Server Action.
// ---------------------------------------------------------------------------

export const listApprovedEmprendimientos = cache(
  async (
    cityId: string,
    opts: EmprendimientosQueryOpts,
  ): Promise<EmprendimientoSummary[]> => {
    const client = await getServerClient();
    return fetchApprovedEmprendimientos(client, cityId, opts);
  },
);

export const getEmprendimientoById = cache(
  async (id: string): Promise<EmprendimientoDetail | null> => {
    const client = await getServerClient();
    return fetchEmprendimientoById(client, id);
  },
);

export const getMyEmprendimientosForCity = cache(
  async (cityId: string, userId: string): Promise<EmprendimientoSummary[]> => {
    const client = await getServerClient();
    return fetchMyEmprendimientos(client, cityId, userId);
  },
);

export const getHasRecommended = cache(
  async (emprendimientoId: string, userId: string): Promise<boolean> => {
    const client = await getServerClient();
    return fetchHasRecommended(client, emprendimientoId, userId);
  },
);
