import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { getServerClient } from '@/utils/supabase/server';
import { eventQuerySchema } from '../schemas/communityEvent.schema';
import { monthBounds } from '../lib/event-dates';
import type { CommunityEvent, EventPage } from '../types/communityEvent.types';
const EVENT_COLUMNS = 'id,community_id,title,description,starts_at,ends_at,location,virtual_url,organizer,registration_info,registration_url,cover_asset_id,rsvp_enabled,is_published,is_cancelled,version,cover:community_library_assets(id,title,media_id,deleted_at)';
const PAGE_SIZE = 30;
function readableCover(event: CommunityEvent): CommunityEvent {
  if (!event.cover || event.cover.deleted_at) return { ...event, cover: null };
  const { id, title, media_id } = event.cover;
  return { ...event, cover: { id, title, media_id } };
}
/** Request cache only; event publication, community audience and cover RLS all apply. */
export const getCommunityEvents = cache(async (communityId: string, month: string, cursorJson: string | null = null): Promise<EventPage> => {
  const value = eventQuerySchema.parse({ communityId, month, cursor: cursorJson ? JSON.parse(cursorJson) : null });
  const client = await getServerClient();
  const bounds = monthBounds(month);
  let query = client.from('community_events').select(EVENT_COLUMNS).eq('community_id', communityId).is('deleted_at', null)
    .lt('starts_at', bounds.until).gt('ends_at', bounds.from).order('starts_at').order('id').limit(PAGE_SIZE + 1);
  if (value.cursor) query = query.or(`starts_at.gt.${value.cursor.startsAt},and(starts_at.eq.${value.cursor.startsAt},id.gt.${value.cursor.id})`);
  const { data, error } = await query;
  if (error) throw new Error('No se pudieron cargar los eventos.');
  const rows = (data ?? []) as unknown as CommunityEvent[];
  const items = rows.slice(0, PAGE_SIZE).map(readableCover); const last = items.at(-1);
  return { items, nextCursor: rows.length > PAGE_SIZE && last ? { id: last.id, startsAt: last.starts_at } : null };
});
export const getCommunityEvent = cache(async (communityId: string, eventId: string): Promise<CommunityEvent | null> => {
  z.uuid().parse(communityId); z.uuid().parse(eventId);
  const client = await getServerClient();
  const { data, error } = await client.from('community_events').select(EVENT_COLUMNS)
    .eq('community_id', communityId).eq('id', eventId).is('deleted_at', null).maybeSingle();
  if (error) throw new Error('No se pudo cargar el evento.');
  return data ? readableCover(data as unknown as CommunityEvent) : null;
});
export const getEventAttendance = cache(async (eventId: string) => {
  z.uuid().parse(eventId);
  const client = await getServerClient(); const { data: { user } } = await client.auth.getUser();
  if (!user) return { signedIn: false, attending: false };
  const { data, error } = await client.from('community_event_attendance').select('event_id').eq('event_id', eventId).eq('user_id', user.id).maybeSingle();
  if (error) throw new Error('No se pudo cargar tu asistencia.');
  return { signedIn: true, attending: Boolean(data) };
});
