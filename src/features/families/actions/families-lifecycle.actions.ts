'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { listFamiliesForProfile } from '../server/families.server';
import type {
CreateFamilyDto,
UpdateFamilyDto
} from '../types/family.types';
import { ActionResult,MAX_FAMILIES_PER_OWNER,RESERVED_FAMILY_SLUGS,familySlug,requireSession,revalidateFamilyPaths } from './families-helpers';

export async function createFamily(
  dto: CreateFamilyDto,
): Promise<ActionResult<{ slug: string; id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { userId, client } = session;

  const name = (dto.name ?? '').trim();
  if (!name) return { ok: false, error: 'El nombre es obligatorio.' };
  if (name.length > 80) return { ok: false, error: 'El nombre es demasiado largo (máx. 80).' };

  const { count: ownerCount } = await client
    .from('families')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);
  if ((ownerCount ?? 0) >= MAX_FAMILIES_PER_OWNER) {
    return { ok: false, error: `Solo puedes crear hasta ${MAX_FAMILIES_PER_OWNER} familias.` };
  }

  // Service role for slug existence check — RLS hides families the user can't
  // see, which would let two users race-create the same slug. Reserved-slug
  // check protects against shadowing a concrete /familias/<route> page.
  const svc = getServiceClient();
  const baseSlug = familySlug(name);
  let slug = RESERVED_FAMILY_SLUGS.has(baseSlug) ? `${baseSlug}-1` : baseSlug;
  for (let i = 2; i < 50; i += 1) {
    if (RESERVED_FAMILY_SLUGS.has(slug)) {
      slug = `${baseSlug}-${i}`;
      continue;
    }
    const { data: clash } = await svc.from('families').select('id').eq('slug', slug).maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${i}`;
  }

  const { data, error } = await client
    .from('families')
    .insert({
      owner_id: userId,
      name,
      slug,
      description: dto.description?.trim() || null,
      cover_cf_image_id: dto.coverImageId ?? null,
    })
    .select('id, slug')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo crear la familia.' };
  }

  revalidateFamilyPaths();
  return { ok: true, data: { id: data.id, slug: data.slug } };
}

export async function updateFamily(
  dto: UpdateFamilyDto,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const patch: Record<string, unknown> = {};
  if (dto.name !== undefined) {
    const trimmed = dto.name.trim();
    if (!trimmed) return { ok: false, error: 'El nombre no puede estar vacío.' };
    if (trimmed.length > 80) return { ok: false, error: 'El nombre es demasiado largo (máx. 80).' };
    patch.name = trimmed;
  }
  if (dto.description !== undefined) {
    patch.description = dto.description?.trim() || null;
  }
  if (dto.coverImageId !== undefined) {
    patch.cover_cf_image_id = dto.coverImageId;
  }
  if (dto.memberCanInvite !== undefined) patch.member_can_invite = dto.memberCanInvite;
  if (dto.memberCanAddPersons !== undefined) patch.member_can_add_persons = dto.memberCanAddPersons;
  if (dto.memberCanAddEvents !== undefined) patch.member_can_add_events = dto.memberCanAddEvents;
  if (dto.memberCanAddPhotos !== undefined) patch.member_can_add_photos = dto.memberCanAddPhotos;
  if (dto.memberCanAddStories !== undefined) patch.member_can_add_stories = dto.memberCanAddStories;
  if (dto.memberCanAddDocuments !== undefined) patch.member_can_add_documents = dto.memberCanAddDocuments;
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No hay cambios.' };
  }

  const { error } = await session.client.from('families').update(patch).eq('id', dto.id);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: dto.id } };
}

export async function deleteFamily(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { error } = await session.client.from('families').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id } };
}

// Returns the families a profile belongs to, intersected with the viewer's own
// memberships. Self-view returns all viewer's families. Privacy: never reveals
// a family the viewer isn't already a member of (mutual visibility only).
export async function getFamiliesForProfileAction(profileId: string) {
  const data = await listFamiliesForProfile(profileId);
  return { ok: true as const, data };
}
