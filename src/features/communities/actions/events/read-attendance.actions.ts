'use server';
import { revalidatePath } from 'next/cache';
import { eventQuerySchema, attendanceSchema } from '../../schemas/communityEvent.schema';
import { getCommunityEvents } from '../../server/community-events.server';
import { requireSession, type ActionResult } from '../_shared';
import type { EventPage } from '../../types/communityEvent.types';

export async function loadCommunityEvents(input: unknown): Promise<ActionResult<EventPage>> {
  const parsed = eventQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revisa el mes seleccionado.' };
  try {
    const v = parsed.data;
    return { ok: true, data: await getCommunityEvents(v.communityId, v.month, v.cursor ? JSON.stringify(v.cursor) : null) };
  } catch { return { ok: false, error: 'No se pudieron cargar los eventos. Inténtalo de nuevo.' }; }
}
export async function setEventAttendance(input: unknown): Promise<ActionResult<{ attending: boolean }>> {
  const parsed = attendanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Revisa el evento seleccionado.' };
  try {
    const session = await requireSession();
    if (!session) return { ok: false, error: 'Inicia sesión para confirmar tu asistencia.' };
    const { data, error } = await session.client.rpc('set_community_event_attendance', { target_event: parsed.data.eventId, attending: parsed.data.attending });
    if (error) return { ok: false, error: error.code === '23514' ? 'La confirmación de asistencia está cerrada.' : 'El evento no está disponible o ya no tienes acceso.' };
    revalidatePath('/feed/comunidades/[slug]/eventos/[eventId]', 'page');
    return { ok: true, data: { attending: data === true } };
  } catch { return { ok: false, error: 'No se pudo actualizar tu asistencia. Inténtalo de nuevo.' }; }
}
