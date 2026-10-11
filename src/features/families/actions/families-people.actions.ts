'use server';

import type {
AddParentsDto,
AddPersonDto,
UpdatePersonDto
} from '../types/family.types';
import { ActionResult,requireSession,revalidateFamilyPaths } from './families-helpers';

export async function addPerson(dto: AddPersonDto): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  if (!dto.fullName?.trim()) return { ok: false, error: 'El nombre completo es obligatorio.' };

  const { data, error } = await session.client
    .from('family_persons')
    .insert({
      family_id: dto.familyId,
      full_name: dto.fullName.trim(),
      gender: dto.gender ?? 'unknown',
      birth_date: dto.birthDate || null,
      birth_place: dto.birthPlace || null,
      death_date: dto.deathDate || null,
      death_place: dto.deathPlace || null,
      bio: dto.bio || null,
      avatar_cf_image_id: dto.avatarImageId ?? null,
      added_by: session.userId,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo agregar.' };
  revalidateFamilyPaths();
  return { ok: true, data: { id: data.id } };
}

export async function updatePerson(
  dto: UpdatePersonDto,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const patch: Record<string, unknown> = {};
  if (dto.fullName !== undefined) {
    const trimmed = dto.fullName.trim();
    if (!trimmed) return { ok: false, error: 'El nombre no puede estar vacío.' };
    patch.full_name = trimmed;
  }
  if (dto.gender !== undefined) patch.gender = dto.gender;
  if (dto.birthDate !== undefined) patch.birth_date = dto.birthDate || null;
  if (dto.birthPlace !== undefined) patch.birth_place = dto.birthPlace?.trim() || null;
  if (dto.deathDate !== undefined) patch.death_date = dto.deathDate || null;
  if (dto.deathPlace !== undefined) patch.death_place = dto.deathPlace?.trim() || null;
  if (dto.bio !== undefined) patch.bio = dto.bio?.trim() || null;
  if (dto.avatarImageId !== undefined) patch.avatar_cf_image_id = dto.avatarImageId;
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No hay cambios.' };
  }

  const { error } = await session.client
    .from('family_persons')
    .update(patch)
    .eq('id', dto.id);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: dto.id } };
}

export async function deletePerson(personId: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { error } = await session.client.from('family_persons').delete().eq('id', personId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: personId } };
}

export async function addFamilyParents(
  dto: AddParentsDto,
): Promise<ActionResult<{ fatherId: string | null; motherId: string | null }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const fatherJson = dto.father
    ? {
        fullName: dto.father.fullName.trim(),
        gender: dto.father.gender ?? 'male',
        birthDate: dto.father.birthDate ?? '',
        birthPlace: dto.father.birthPlace ?? '',
        deathDate: dto.father.deathDate ?? '',
        deathPlace: dto.father.deathPlace ?? '',
        bio: dto.father.bio ?? '',
        avatarImageId: dto.father.avatarImageId ?? '',
      }
    : null;
  const motherJson = dto.mother
    ? {
        fullName: dto.mother.fullName.trim(),
        gender: dto.mother.gender ?? 'female',
        birthDate: dto.mother.birthDate ?? '',
        birthPlace: dto.mother.birthPlace ?? '',
        deathDate: dto.mother.deathDate ?? '',
        deathPlace: dto.mother.deathPlace ?? '',
        bio: dto.mother.bio ?? '',
        avatarImageId: dto.mother.avatarImageId ?? '',
      }
    : null;

  if (!fatherJson && !motherJson && !dto.fatherExistingId && !dto.motherExistingId) {
    return { ok: false, error: 'Debes especificar al menos un padre o madre.' };
  }
  if (fatherJson && !fatherJson.fullName) {
    return { ok: false, error: 'El nombre del padre es obligatorio.' };
  }
  if (motherJson && !motherJson.fullName) {
    return { ok: false, error: 'El nombre de la madre es obligatorio.' };
  }

  const { data, error } = await session.client.rpc('add_family_parents', {
    p_family_id: dto.familyId,
    p_child_id: dto.childId,
    p_father: fatherJson,
    p_mother: motherJson,
    p_father_existing_id: dto.fatherExistingId ?? null,
    p_mother_existing_id: dto.motherExistingId ?? null,
  });
  if (error) return { ok: false, error: error.message };
  // RPC returns table(father_id, mother_id) — supabase-js wraps as array
  const row = Array.isArray(data) && data.length > 0 ? (data[0] as { father_id: string | null; mother_id: string | null }) : null;
  revalidateFamilyPaths();
  return {
    ok: true,
    data: {
      fatherId: row?.father_id ?? null,
      motherId: row?.mother_id ?? null,
    },
  };
}
