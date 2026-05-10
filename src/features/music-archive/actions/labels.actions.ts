'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/utils/supabase/server';
import type {
  CreateLabelDto,
  MusicLabelRow,
  UpdateLabelDto,
} from '../types/music.types';
import {
  adminGate,
  requireSession,
  uniqueSlug,
  type ActionResult,
} from './_shared';

export async function createLabel(
  dto: CreateLabelDto,
): Promise<ActionResult<MusicLabelRow>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const name = dto.name.trim();
  if (!name) return { ok: false, error: 'El nombre del sello es obligatorio.' };

  const slug = await uniqueSlug(session.client, 'music_labels', name);

  const { data, error } = await session.client
    .from('music_labels')
    .insert({
      name,
      slug,
      country: dto.country?.trim() || null,
      founded: dto.founded ?? null,
    })
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as MusicLabelRow };
}

export async function findOrCreateLabelAction(
  dto: CreateLabelDto,
): Promise<ActionResult<MusicLabelRow>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const name = dto.name.trim();
  if (!name) return { ok: false, error: 'El nombre del sello es obligatorio.' };

  const { data: existing } = await session.client
    .from('music_labels')
    .select('*')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true, data: existing as MusicLabelRow };

  return createLabel(dto);
}

export async function updateLabel(
  id: string,
  dto: UpdateLabelDto,
): Promise<ActionResult<MusicLabelRow>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  const patch: Record<string, unknown> = {};
  if (dto.name !== undefined) patch.name = dto.name.trim();
  if (dto.country !== undefined)
    patch.country = dto.country?.trim().toUpperCase().slice(0, 2) || null;
  if (dto.founded !== undefined) patch.founded = dto.founded;
  const { data, error } = await service
    .from('music_labels')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as MusicLabelRow };
}

export async function deleteLabel(id: string): Promise<ActionResult<{ deleted: true }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  // Albums.label_id is on-delete-set-null, so no media cleanup needed —
  // albums survive, just disconnected from the deleted label.
  const { error } = await service.from('music_labels').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/musica');
  return { ok: true, data: { deleted: true } };
}

export async function listAdminLabels(q?: string): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      slug: string;
      country: string | null;
      founded: number | null;
      album_count: number;
    }>
  >
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  let query = service
    .from('music_labels')
    .select('id, name, slug, country, founded')
    .order('name', { ascending: true })
    .limit(200);
  const trimmed = q?.trim();
  if (trimmed) query = query.ilike('name', `%${trimmed}%`);
  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };
  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    country: string | null;
    founded: number | null;
  }>;

  const labelIds = rows.map((r) => r.id);
  const counts = new Map<string, number>();
  if (labelIds.length > 0) {
    const { data: albs } = await service
      .from('music_albums')
      .select('label_id')
      .in('label_id', labelIds);
    for (const a of (albs ?? []) as Array<{ label_id: string }>) {
      counts.set(a.label_id, (counts.get(a.label_id) ?? 0) + 1);
    }
  }

  return { ok: true, data: rows.map((r) => ({ ...r, album_count: counts.get(r.id) ?? 0 })) };
}
