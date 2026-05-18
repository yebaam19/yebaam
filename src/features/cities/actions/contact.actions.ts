'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import type { ContactStatus } from '../server/contact.server';

/**
 * Server Actions for the city contact form.
 *
 * `sendCityContactMessage` is open to any authenticated user — RLS gates the
 * row to `sender_id = auth.uid()`. `markCityMessageStatus` is the admin path
 * used by the inbox (Phase 7 admin surface); we ship it here so the action
 * lives next to the read function it inverts. RLS gates that update path
 * too: only city admins or platform admins can flip the status.
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

const ALLOWED_STATUSES = new Set<ContactStatus>(['new', 'read', 'resolved']);

const MAX_SUBJECT_LEN = 200;
const MAX_BODY_LEN = 5000;

export interface SendContactInput {
  cityId: string;
  subject: string;
  body: string;
}

export async function sendCityContactMessage(
  input: SendContactInput,
): Promise<ActionResult<{ id: string }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  const subject = (input.subject ?? '').trim();
  if (subject.length > MAX_SUBJECT_LEN) {
    return { ok: false, error: 'subject_too_long' };
  }

  const body = (input.body ?? '').trim();
  if (!body) return { ok: false, error: 'body_required' };
  if (body.length > MAX_BODY_LEN) return { ok: false, error: 'body_too_long' };

  const insertPayload = {
    city_id: input.cityId,
    sender_id: sess.userId,
    subject: subject || null,
    body,
    status: 'new',
  };

  const { data, error } = await sess.client
    .from('city_contact_messages')
    .insert(insertPayload)
    .select('id')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'insert_returned_no_row' };

  revalidatePath('/cities/[slug]/contact', 'page');
  return { ok: true, data: { id: data.id as string } };
}

export async function markCityMessageStatus(input: {
  messageId: string;
  status: ContactStatus;
}): Promise<ActionResult<{ id: string; status: ContactStatus }>> {
  const sess = await requireSession();
  if ('error' in sess) return { ok: false, error: sess.error };

  if (!ALLOWED_STATUSES.has(input.status)) {
    return { ok: false, error: 'invalid_status' };
  }

  // RLS enforces city-admin-or-platform-admin.
  const { data, error } = await sess.client
    .from('city_contact_messages')
    .update({ status: input.status })
    .eq('id', input.messageId)
    .select('id, status')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'not_found_or_forbidden' };

  revalidatePath('/cities/[slug]/contact', 'page');
  return {
    ok: true,
    data: { id: data.id as string, status: data.status as ContactStatus },
  };
}
