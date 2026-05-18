import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import { cfImageUrl } from './cf';

/**
 * RSC-friendly read functions for City Classifieds (PDF page 4 → "Clasificados").
 *
 * The lower-case `fetchX(client, …)` helpers accept the Supabase client
 * directly so vitest can hit them with the anon publishable key — the same
 * shape as the surrounding city server modules. The `cache()` wrappers
 * dedupe per request so a list + a count on the same page don't repeat
 * the round-trip.
 *
 * Author identity is intentionally NOT joined here. The Phase-6 grid card
 * only shows the title, image, kind and price; the detail page does. If the
 * detail page later needs the author profile, add a thin `getClassifiedByIdWithAuthor`
 * helper rather than widening this one.
 */

export type ClassifiedKind = 'offer' | 'want' | 'trade' | 'free';
export type ClassifiedStatus = 'open' | 'sold' | 'closed';

export interface ClassifiedDetail {
  id: string;
  cityId: string;
  authorId: string | null;
  title: string;
  description: string | null;
  priceCents: number | null;
  currency: string;
  kind: ClassifiedKind;
  status: ClassifiedStatus;
  cfImageIds: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

type ClassifiedRow = {
  id: string;
  city_id: string;
  author_id: string | null;
  title: string;
  description: string | null;
  price_cents: number | null;
  currency: string;
  kind: string;
  status: string;
  cf_image_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

const CLASSIFIED_SELECT =
  'id, city_id, author_id, title, description, price_cents, currency, kind, status, cf_image_ids, created_at, updated_at';

function toDetail(row: ClassifiedRow): ClassifiedDetail {
  const ids = row.cf_image_ids ?? [];
  return {
    id: row.id,
    cityId: row.city_id,
    authorId: row.author_id,
    title: row.title,
    description: row.description,
    priceCents: row.price_cents,
    currency: row.currency,
    kind: row.kind as ClassifiedKind,
    status: row.status as ClassifiedStatus,
    cfImageIds: ids,
    imageUrls: ids
      .map((id) => cfImageUrl(id))
      .filter((u): u is string => Boolean(u)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ClassifiedsQueryOpts {
  /** Constrain by `kind`; omit to include every kind. */
  kind?: ClassifiedKind;
  /** Free-text search applied to `title` with `ilike`. */
  q?: string;
  limit: number;
  offset: number;
}

export async function fetchOpenClassifieds(
  client: SupabaseClient,
  cityId: string,
  opts: ClassifiedsQueryOpts,
): Promise<ClassifiedDetail[]> {
  let q = client
    .from('city_classifieds')
    .select(CLASSIFIED_SELECT)
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
    console.error('[fetchOpenClassifieds]', error);
    return [];
  }
  return (data ?? []).map((r) => toDetail(r as unknown as ClassifiedRow));
}

export async function fetchClassifiedById(
  client: SupabaseClient,
  classifiedId: string,
): Promise<ClassifiedDetail | null> {
  const { data, error } = await client
    .from('city_classifieds')
    .select(CLASSIFIED_SELECT)
    .eq('id', classifiedId)
    .maybeSingle();
  if (error) {
    console.error('[fetchClassifiedById]', error);
    return null;
  }
  if (!data) return null;
  return toDetail(data as unknown as ClassifiedRow);
}

// ---------------------------------------------------------------------------
// Cached request-scoped wrappers — only safe inside an RSC / Server Action.
// ---------------------------------------------------------------------------

export const listOpenClassifieds = cache(
  async (
    cityId: string,
    opts: ClassifiedsQueryOpts,
  ): Promise<ClassifiedDetail[]> => {
    const client = await getServerClient();
    return fetchOpenClassifieds(client, cityId, opts);
  },
);

export const getClassifiedById = cache(
  async (classifiedId: string): Promise<ClassifiedDetail | null> => {
    const client = await getServerClient();
    return fetchClassifiedById(client, classifiedId);
  },
);
