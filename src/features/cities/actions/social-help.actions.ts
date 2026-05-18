'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import type { HelpKind } from '../server/social-help.server';

/**
 * Server Actions for City Social Help.
 *
 * Same shape as classifieds: `requireSession()` resolves user+client; the
 * action persists and revalidates the listing path. `author_id` is read
 * from `auth.uid()` via the session, never from the caller. A single
 * Cloudflare image is allowed per entry (singular column on this table).
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

const ALLOWED_KINDS = new Set<HelpKind>(['offer', 'need']);

const MAX_TITLE_LEN = 200;
const MAX_DESCRIPTION_LEN = 5000;

export interface PostHelpInput {
  cityId: string;
  title: string;
  description: string;
  kind: HelpKind;
  cfImageId?: string | null;
}

export async function postHelp(
  input: PostHelpInput,
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

  const insertPayload = {
    city_id: input.cityId,
    author_id: sess.userId,
    title,
    description: description || null,
    kind: input.kind,
    cf_image_id: input.cfImageId ?? null,
    status: 'open',
  };

  const { data, error } = await sess.client
    .from('city_social_help')
    .insert(insertPayload)
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'insert_returned_no_row' };

  revalidatePath('/cities/[slug]/social-help', 'page');
  revalidatePath('/cities/[slug]', 'page');
  return { ok: true, data: { id: data.id as string } };
}

export async function closeHelp(input: {
  helpId: string;
}): Promise<ActionResult<{ id: string }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  // RLS enforces author-or-admin.
  const { data, error } = await sess.client
    .from('city_social_help')
    .update({ status: 'closed' })
    .eq('id', input.helpId)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'not_found_or_forbidden' };

  revalidatePath('/cities/[slug]/social-help', 'page');
  revalidatePath('/cities/[slug]/social-help/[id]', 'page');
  return { ok: true, data: { id: data.id as string } };
}
