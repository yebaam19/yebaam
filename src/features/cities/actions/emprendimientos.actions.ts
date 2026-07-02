'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import {
  EMPRENDIMIENTO_CATEGORIES,
  type EmprendimientoCategory,
  type EmprendimientoStatus,
} from '../server/emprendimientos.server';

/**
 * Server Actions for City Emprendimientos.
 *
 * Same conventions as `classifieds.actions.ts`: local `requireSession()`
 * that RETURNS `{ error }` (never throws — Next.js redacts thrown Server
 * Action messages in production), `owner_id` always from the session, and
 * zero trust in client-supplied Cloudflare id lists.
 *
 * Status is never written here: INSERTs rely on the DB default (PENDING)
 * and the `tg_city_emprendimientos_guard` trigger resets APPROVED/REJECTED
 * rows back to PENDING on content edits — so the review queue can never be
 * bypassed even by handcrafted PostgREST calls.
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

const CATEGORY_SET = new Set<string>(EMPRENDIMIENTO_CATEGORIES);

const MAX_NAME_LEN = 120;
const MAX_SHORT_DESCRIPTION_LEN = 280;
const MAX_STORY_LEN = 5000;
const MAX_ZONE_LEN = 160;
const MAX_ADDRESS_LEN = 200;
const MAX_PHONE_LEN = 30;
const MAX_MEDIA = 6;

export interface EmprendimientoMediaInput {
  type: 'IMAGE' | 'VIDEO';
  cfImageId?: string | null;
  cfStreamUid?: string | null;
  caption?: string | null;
}

export interface EmprendimientoInput {
  cityId: string;
  name: string;
  shortDescription: string;
  story?: string | null;
  category: EmprendimientoCategory;
  zone?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  heroCfImageId?: string | null;
  ownerCfImageId?: string | null;
  media?: EmprendimientoMediaInput[];
}

type ValidatedInput = {
  name: string;
  short_description: string;
  story: string | null;
  category: EmprendimientoCategory;
  zone: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  hero_cf_image_id: string | null;
  owner_cf_image_id: string | null;
  media: Array<{
    type: 'IMAGE' | 'VIDEO';
    cf_image_id: string | null;
    cf_stream_uid: string | null;
    caption: string | null;
    position: number;
  }>;
};

function cleanOptional(value: string | null | undefined, max: number): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function cleanCfId(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function validateInput(input: EmprendimientoInput): ValidatedInput | { error: string } {
  const name = (input.name ?? '').trim();
  if (!name) return { error: 'name_required' };
  if (name.length > MAX_NAME_LEN) return { error: 'name_too_long' };

  const shortDescription = (input.shortDescription ?? '').trim();
  if (!shortDescription) return { error: 'short_description_required' };
  if (shortDescription.length > MAX_SHORT_DESCRIPTION_LEN) {
    return { error: 'short_description_too_long' };
  }

  const story = cleanOptional(input.story, MAX_STORY_LEN);
  if (!CATEGORY_SET.has(input.category)) return { error: 'invalid_category' };

  // Trust nothing in the client media list: enforce type↔id consistency and
  // cap the count, mirroring the DB CHECK constraint.
  const media: ValidatedInput['media'] = [];
  for (const item of input.media ?? []) {
    const cfImageId = cleanCfId(item.cfImageId);
    const cfStreamUid = cleanCfId(item.cfStreamUid);
    if (item.type === 'IMAGE' && cfImageId) {
      media.push({
        type: 'IMAGE',
        cf_image_id: cfImageId,
        cf_stream_uid: null,
        caption: cleanOptional(item.caption, 200),
        position: media.length,
      });
    } else if (item.type === 'VIDEO' && cfStreamUid) {
      media.push({
        type: 'VIDEO',
        cf_image_id: null,
        cf_stream_uid: cfStreamUid,
        caption: cleanOptional(item.caption, 200),
        position: media.length,
      });
    }
  }
  if (media.length > MAX_MEDIA) return { error: 'too_many_media' };

  return {
    name,
    short_description: shortDescription,
    story,
    category: input.category,
    zone: cleanOptional(input.zone, MAX_ZONE_LEN),
    address: cleanOptional(input.address, MAX_ADDRESS_LEN),
    phone: cleanOptional(input.phone, MAX_PHONE_LEN),
    whatsapp: cleanOptional(input.whatsapp, MAX_PHONE_LEN),
    hero_cf_image_id: cleanCfId(input.heroCfImageId),
    owner_cf_image_id: cleanCfId(input.ownerCfImageId),
    media,
  };
}

function revalidateEmprendimientos() {
  revalidatePath('/cities/[slug]/emprendimientos', 'page');
  revalidatePath('/cities/[slug]/emprendimientos/[id]', 'page');
  revalidatePath('/cities/[slug]', 'page');
}

export async function createEmprendimiento(
  input: EmprendimientoInput,
): Promise<ActionResult<{ id: string }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  const valid = validateInput(input);
  if ('error' in valid) return { ok: false, error: valid.error };
  const { media, ...fields } = valid;

  const { data, error } = await sess.client
    .from('city_emprendimientos')
    .insert({ ...fields, city_id: input.cityId, owner_id: sess.userId })
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'insert_returned_no_row' };
  const id = data.id as string;

  if (media.length > 0) {
    const { error: mediaError } = await sess.client
      .from('city_emprendimiento_media')
      .insert(media.map((m) => ({ ...m, emprendimiento_id: id })));
    if (mediaError) {
      // Don't leave a half-created listing behind: roll the main row back so
      // the user can simply retry the whole submit.
      console.error('[createEmprendimiento] media insert failed', mediaError);
      await sess.client.from('city_emprendimientos').delete().eq('id', id);
      return { ok: false, error: 'media_failed' };
    }
  }

  revalidateEmprendimientos();
  return { ok: true, data: { id } };
}

export async function updateEmprendimiento(
  input: EmprendimientoInput & { id: string },
): Promise<ActionResult<{ id: string; willNeedReview: boolean }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  const valid = validateInput(input);
  if ('error' in valid) return { ok: false, error: valid.error };
  const { media, ...fields } = valid;

  // RLS enforces owner-or-admin; the guard trigger owns the status reset.
  const { data, error } = await sess.client
    .from('city_emprendimientos')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', input.id)
    .select('id, status')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'not_found_or_forbidden' };

  // Replace the media set wholesale — simplest correct model for ≤6 slots.
  // Any media failure is surfaced to the user (never a silent success): if
  // the delete fails the old gallery is intact; if the insert fails the
  // gallery is empty but the composer still holds the drafts, so retrying
  // the save re-inserts everything.
  const { error: deleteError } = await sess.client
    .from('city_emprendimiento_media')
    .delete()
    .eq('emprendimiento_id', input.id);
  if (deleteError) {
    console.error('[updateEmprendimiento] media delete failed', deleteError);
    revalidateEmprendimientos();
    return { ok: false, error: 'media_failed' };
  }
  if (media.length > 0) {
    const { error: mediaError } = await sess.client
      .from('city_emprendimiento_media')
      .insert(media.map((m) => ({ ...m, emprendimiento_id: input.id })));
    if (mediaError) {
      console.error('[updateEmprendimiento] media insert failed', mediaError);
      revalidateEmprendimientos();
      return { ok: false, error: 'media_failed' };
    }
  }

  revalidateEmprendimientos();
  return {
    ok: true,
    data: {
      id: data.id as string,
      willNeedReview: (data.status as EmprendimientoStatus) !== 'APPROVED',
    },
  };
}

export async function deleteEmprendimiento(input: {
  id: string;
}): Promise<ActionResult<{ id: string }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  // RLS enforces owner-or-admin.
  const { data, error } = await sess.client
    .from('city_emprendimientos')
    .delete()
    .eq('id', input.id)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'not_found_or_forbidden' };

  revalidateEmprendimientos();
  return { ok: true, data: { id: data.id as string } };
}

export async function toggleRecommendation(input: {
  emprendimientoId: string;
}): Promise<ActionResult<{ hasRecommended: boolean; recommendationsCount: number }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  const { data, error } = await sess.client.rpc('toggle_emprendimiento_recommendation', {
    p_emprendimiento_id: input.emprendimientoId,
  });
  if (error) return { ok: false, error: error.message };

  const result = data as { has_recommended: boolean; recommendations_count: number };
  revalidatePath('/cities/[slug]/emprendimientos/[id]', 'page');
  return {
    ok: true,
    data: {
      hasRecommended: result.has_recommended,
      recommendationsCount: result.recommendations_count,
    },
  };
}
