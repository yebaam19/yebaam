'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import type {
  ClassifiedKind,
  ClassifiedStatus,
} from '../server/classifieds.server';

/**
 * Server Actions for City Classifieds.
 *
 * Authentication uses the same `requireSession()` shape as `city.actions.ts`
 * and `public-chat.actions.ts` — keep them aligned so the client-island
 * unauth bounce-to-login path is identical across every portal feature.
 * `author_id` is always read from `auth.uid()` via the session — never from
 * the caller payload, which RLS would block anyway but is good defense-in-depth.
 *
 * Multi-image uploads are not performed here: the client uploads to
 * Cloudflare Images via `uploadService.uploadImage()` before submit and
 * passes the list of resulting CF image ids. The action only persists ids.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type Session = { userId: string; client: SupabaseClient };

async function requireSession(): Promise<Session | { error: string }> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return { error: 'unauthenticated' };
  return { userId: data.user.id, client };
}

const ALLOWED_KINDS = new Set<ClassifiedKind>(['offer', 'want', 'trade', 'free']);
const ALLOWED_STATUSES = new Set<ClassifiedStatus>(['open', 'sold', 'closed']);

const MAX_TITLE_LEN = 200;
const MAX_DESCRIPTION_LEN = 5000;

export interface PostClassifiedInput {
  cityId: string;
  title: string;
  description: string;
  kind: ClassifiedKind;
  priceCents: number | null;
  currency?: string;
  cfImageIds: string[];
}

export async function postClassified(
  input: PostClassifiedInput,
): Promise<ActionResult<{ id: string }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  const title = (input.title ?? '').trim();
  if (!title) return { ok: false, error: 'title_required' };
  if (title.length > MAX_TITLE_LEN) return { ok: false, error: 'title_too_long' };

  const description = (input.description ?? '').trim();
  if (description.length > MAX_DESCRIPTION_LEN) {
    return { ok: false, error: 'description_too_long' };
  }

  if (!ALLOWED_KINDS.has(input.kind)) {
    return { ok: false, error: 'invalid_kind' };
  }

  if (
    input.priceCents !== null &&
    (!Number.isInteger(input.priceCents) || input.priceCents < 0)
  ) {
    return { ok: false, error: 'invalid_price' };
  }

  const insertPayload = {
    city_id: input.cityId,
    author_id: sess.userId,
    title,
    description: description || null,
    price_cents: input.priceCents,
    currency: input.currency ?? 'COP',
    kind: input.kind,
    cf_image_ids: input.cfImageIds ?? [],
    status: 'open',
  };

  const { data, error } = await sess.client
    .from('city_classifieds')
    .insert(insertPayload)
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'insert_returned_no_row' };

  revalidatePath('/cities/[slug]/classifieds', 'page');
  revalidatePath('/cities/[slug]', 'page');
  return { ok: true, data: { id: data.id as string } };
}

export async function updateClassifiedStatus(input: {
  classifiedId: string;
  status: ClassifiedStatus;
}): Promise<ActionResult<{ id: string; status: ClassifiedStatus }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  if (!ALLOWED_STATUSES.has(input.status)) {
    return { ok: false, error: 'invalid_status' };
  }

  // RLS enforces author-or-admin — we don't pre-check here.
  const { data, error } = await sess.client
    .from('city_classifieds')
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq('id', input.classifiedId)
    .select('id, status')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'not_found_or_forbidden' };

  revalidatePath('/cities/[slug]/classifieds', 'page');
  revalidatePath('/cities/[slug]/classifieds/[id]', 'page');
  return {
    ok: true,
    data: { id: data.id as string, status: data.status as ClassifiedStatus },
  };
}

export async function deleteClassified(input: {
  id: string;
}): Promise<ActionResult<{ id: string }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  // RLS enforces author-or-admin.
  const { data, error } = await sess.client
    .from('city_classifieds')
    .delete()
    .eq('id', input.id)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'not_found_or_forbidden' };

  revalidatePath('/cities/[slug]/classifieds', 'page');
  return { ok: true, data: { id: data.id as string } };
}
