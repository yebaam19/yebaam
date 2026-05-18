import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';

/**
 * RSC-friendly read functions for City Contact Messages.
 *
 * Two reads with different audiences:
 *  - `fetchMyMessagesForCity(client, cityId, userId)` is for the user-side
 *    "Mis mensajes anteriores" panel. RLS gates by `sender_id = auth.uid()`,
 *    so calling this with an anon client always returns `[]`.
 *  - `fetchCityInboxForAdmin(client, cityId)` is the admin inbox. RLS gates
 *    by `is_city_admin(city_id, auth.uid())`. Passing a service-role client
 *    bypasses RLS — which is what the admin RSC page already does for
 *    other admin reads in this repo.
 *
 * The `userId` param on `fetchMyMessagesForCity` is intentionally
 * informative-only (it short-circuits the round-trip when null): RLS is the
 * actual gate. Never trust a caller-supplied userId for authorization.
 */

export type ContactStatus = 'new' | 'read' | 'resolved';

export interface ContactMessage {
  id: string;
  cityId: string;
  senderId: string | null;
  subject: string | null;
  body: string;
  status: ContactStatus;
  createdAt: string;
}

type ContactRow = {
  id: string;
  city_id: string;
  sender_id: string | null;
  subject: string | null;
  body: string;
  status: string;
  created_at: string;
};

const CONTACT_SELECT = 'id, city_id, sender_id, subject, body, status, created_at';

function toDto(row: ContactRow): ContactMessage {
  return {
    id: row.id,
    cityId: row.city_id,
    senderId: row.sender_id,
    subject: row.subject,
    body: row.body,
    status: row.status as ContactStatus,
    createdAt: row.created_at,
  };
}

export async function fetchMyMessagesForCity(
  client: SupabaseClient,
  cityId: string,
  userId: string | null,
): Promise<ContactMessage[]> {
  if (!userId) return [];
  const { data, error } = await client
    .from('city_contact_messages')
    .select(CONTACT_SELECT)
    .eq('city_id', cityId)
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    // RLS denial on anon is normal — log only when it surprises us in dev.
    console.error('[fetchMyMessagesForCity]', error);
    return [];
  }
  return (data ?? []).map((r) => toDto(r as unknown as ContactRow));
}

export async function fetchCityInboxForAdmin(
  client: SupabaseClient,
  cityId: string,
): Promise<ContactMessage[]> {
  const { data, error } = await client
    .from('city_contact_messages')
    .select(CONTACT_SELECT)
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('[fetchCityInboxForAdmin]', error);
    return [];
  }
  return (data ?? []).map((r) => toDto(r as unknown as ContactRow));
}

// ---------------------------------------------------------------------------
// Cached request-scoped wrappers — only safe inside an RSC / Server Action.
// ---------------------------------------------------------------------------

export const getMyMessagesForCity = cache(
  async (cityId: string, userId: string | null): Promise<ContactMessage[]> => {
    const client = await getServerClient();
    return fetchMyMessagesForCity(client, cityId, userId);
  },
);
