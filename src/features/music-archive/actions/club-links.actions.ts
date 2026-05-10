'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import { clubAdminGate, type ActionResult } from './_shared';
import type { ClubLinkKind, ClubLinkRow } from '../types/music.types';

interface ClubLinkDto {
  label: string;
  url: string;
  kind: ClubLinkKind;
  description?: string | null;
}

export async function addClubLink(
  clubId: string,
  dto: ClubLinkDto,
): Promise<ActionResult<ClubLinkRow>> {
  const gate = await clubAdminGate(clubId);
  if (!gate.ok) return gate;
  const label = dto.label.trim();
  const url = dto.url.trim();
  if (!label || !url) return { ok: false, error: 'Etiqueta y URL son obligatorios.' };
  if (!/^https?:\/\//i.test(url)) return { ok: false, error: 'URL debe comenzar con http(s)://' };
  const { data, error } = await gate.client
    .from('club_links')
    .insert({
      club_id: clubId,
      label,
      url,
      kind: dto.kind,
      description: dto.description?.trim() || null,
      created_by: gate.userId,
    })
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  await revalidateClub(gate.client, clubId);
  return { ok: true, data: data as ClubLinkRow };
}

export async function updateClubLink(
  linkId: string,
  patch: Partial<ClubLinkDto>,
): Promise<ActionResult<ClubLinkRow>> {
  // Need to read the row first to know which club to gate on. Use service-bypass
  // via the cookie-session client; RLS allows public select on club_links.
  const client = await getServerClient();
  const { data: existing } = await client
    .from('club_links')
    .select('club_id')
    .eq('id', linkId)
    .maybeSingle();
  if (!existing) return { ok: false, error: 'Enlace no encontrado.' };
  const clubId = (existing as { club_id: string }).club_id;
  const gate = await clubAdminGate(clubId);
  if (!gate.ok) return gate;

  const updates: Record<string, unknown> = {};
  if (patch.label !== undefined) updates.label = patch.label.trim();
  if (patch.url !== undefined) {
    const u = patch.url.trim();
    if (!/^https?:\/\//i.test(u)) return { ok: false, error: 'URL inválida.' };
    updates.url = u;
  }
  if (patch.kind !== undefined) updates.kind = patch.kind;
  if (patch.description !== undefined) updates.description = patch.description?.trim() || null;

  const { data, error } = await gate.client
    .from('club_links')
    .update(updates)
    .eq('id', linkId)
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  await revalidateClub(gate.client, clubId);
  return { ok: true, data: data as ClubLinkRow };
}

export async function removeClubLink(linkId: string): Promise<ActionResult<{ removed: true }>> {
  const client = await getServerClient();
  const { data: existing } = await client
    .from('club_links')
    .select('club_id')
    .eq('id', linkId)
    .maybeSingle();
  if (!existing) return { ok: true, data: { removed: true } };
  const clubId = (existing as { club_id: string }).club_id;
  const gate = await clubAdminGate(clubId);
  if (!gate.ok) return gate;
  const { error } = await gate.client.from('club_links').delete().eq('id', linkId);
  if (error) return { ok: false, error: error.message };
  await revalidateClub(gate.client, clubId);
  return { ok: true, data: { removed: true } };
}

async function revalidateClub(client: SupabaseClient, clubId: string) {
  const { data } = await client.from('clubs').select('slug').eq('id', clubId).maybeSingle();
  const slug = (data as { slug: string } | null)?.slug;
  if (slug) revalidatePath(`/musica/clubes/${slug}/links`);
}
