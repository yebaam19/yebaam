'use server';

import type {
AddEventDto,
AddPhotoDto,
AddStoryDto,
FamilyEventType
} from '../types/family.types';
import { ActionResult,requireSession,revalidateFamilyPaths } from './families-helpers';

export async function addEvent(dto: AddEventDto): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  if (!dto.title?.trim()) return { ok: false, error: 'El título es obligatorio.' };

  const { data, error } = await session.client.rpc('add_family_event', {
    p_family_id: dto.familyId,
    p_event_type: dto.eventType as FamilyEventType,
    p_title: dto.title.trim(),
    p_description: dto.description ?? null,
    p_event_date: dto.eventDate ?? null,
    p_event_place: dto.eventPlace ?? null,
    p_person_ids: dto.personIds ?? [],
  });
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo crear el evento.' };
  }
  revalidateFamilyPaths();
  return { ok: true, data: { id: data as string } };
}

export async function addPhoto(dto: AddPhotoDto): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  if (!dto.cfImageId) return { ok: false, error: 'Falta la imagen.' };

  const { data, error } = await session.client.rpc('add_family_photo', {
    p_family_id: dto.familyId,
    p_cf_image_id: dto.cfImageId,
    p_caption: dto.caption ?? null,
    p_taken_at: dto.takenAt ?? null,
    p_person_ids: dto.personIds ?? [],
  });
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo subir la foto.' };
  }
  revalidateFamilyPaths();
  return { ok: true, data: { id: data as string } };
}

export async function addStory(dto: AddStoryDto): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  if (!dto.title?.trim() || !dto.body?.trim()) {
    return { ok: false, error: 'Título y contenido son obligatorios.' };
  }

  const { data, error } = await session.client
    .from('family_stories')
    .insert({
      family_id: dto.familyId,
      title: dto.title.trim(),
      body: dto.body.trim(),
      event_date: dto.eventDate ?? null,
      author_profile_id: session.userId,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear la historia.' };
  revalidateFamilyPaths();
  return { ok: true, data: { id: data.id } };
}
