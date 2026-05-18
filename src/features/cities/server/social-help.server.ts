import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import { cfImageUrl } from './cf';

/**
 * RSC-friendly read functions for City Social Help (PDF page 4 → "Ayuda Social").
 *
 * Mirrors the classifieds server module by design — the shape is intentional
 * so adding a new lightweight city-anchored content type (e.g. "denuncias")
 * stays a copy-tune-rename rather than a re-think. Singular `cf_image_id`
 * here vs. the array on classifieds — be careful not to drift across the two.
 */

export type HelpKind = 'offer' | 'need';
export type HelpStatus = 'open' | 'closed';

export interface HelpDetail {
  id: string;
  cityId: string;
  authorId: string | null;
  title: string;
  description: string | null;
  kind: HelpKind;
  status: HelpStatus;
  cfImageId: string | null;
  imageUrl: string | undefined;
  createdAt: string;
}

type HelpRow = {
  id: string;
  city_id: string;
  author_id: string | null;
  title: string;
  description: string | null;
  kind: string;
  status: string;
  cf_image_id: string | null;
  created_at: string;
};

const HELP_SELECT =
  'id, city_id, author_id, title, description, kind, status, cf_image_id, created_at';

function toDetail(row: HelpRow): HelpDetail {
  return {
    id: row.id,
    cityId: row.city_id,
    authorId: row.author_id,
    title: row.title,
    description: row.description,
    kind: row.kind as HelpKind,
    status: row.status as HelpStatus,
    cfImageId: row.cf_image_id,
    imageUrl: cfImageUrl(row.cf_image_id),
    createdAt: row.created_at,
  };
}

export interface HelpQueryOpts {
  kind?: HelpKind;
  q?: string;
  limit: number;
  offset: number;
}

export async function fetchOpenSocialHelp(
  client: SupabaseClient,
  cityId: string,
  opts: HelpQueryOpts,
): Promise<HelpDetail[]> {
  let q = client
    .from('city_social_help')
    .select(HELP_SELECT)
    .eq('city_id', cityId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .range(opts.offset, opts.offset + Math.max(opts.limit - 1, 0));

  if (opts.kind) {
    q = q.eq('kind', opts.kind);
  }
  if (opts.q && opts.q.trim()) {
    q = q.ilike('title', `%${opts.q.trim()}%`);
  }

  const { data, error } = await q;
  if (error) {
    console.error('[fetchOpenSocialHelp]', error);
    return [];
  }
  return (data ?? []).map((r) => toDetail(r as unknown as HelpRow));
}

export async function fetchHelpById(
  client: SupabaseClient,
  helpId: string,
): Promise<HelpDetail | null> {
  const { data, error } = await client
    .from('city_social_help')
    .select(HELP_SELECT)
    .eq('id', helpId)
    .maybeSingle();
  if (error) {
    console.error('[fetchHelpById]', error);
    return null;
  }
  if (!data) return null;
  return toDetail(data as unknown as HelpRow);
}

// ---------------------------------------------------------------------------
// Cached request-scoped wrappers — only safe inside an RSC / Server Action.
// ---------------------------------------------------------------------------

export const listOpenSocialHelp = cache(
  async (cityId: string, opts: HelpQueryOpts): Promise<HelpDetail[]> => {
    const client = await getServerClient();
    return fetchOpenSocialHelp(client, cityId, opts);
  },
);

export const getHelpById = cache(
  async (helpId: string): Promise<HelpDetail | null> => {
    const client = await getServerClient();
    return fetchHelpById(client, helpId);
  },
);
