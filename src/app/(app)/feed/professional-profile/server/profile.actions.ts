'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import type {
  CreateProfessionalProfileDTO,
  ProfessionalProfile,
  UpdateProfessionalProfileDTO,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import { extractImageId } from '@/lib/media/urls';
import { type ProfileRow, toProfile } from './profile.mappers';
import { listPublicProfiles } from './profile.server';

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireUser() {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data?.user) return { userId: null as string | null };
  return { userId: data.user.id };
}

function revalidateFeed() {
  revalidatePath('/feed/professional-profile', 'page');
  revalidatePath('/feed/professional-profile/[username]', 'page');
}

export async function createProfileAction(
  data: CreateProfessionalProfileDTO,
): Promise<ActionResult<ProfessionalProfile>> {
  const { userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const db = getServiceClient();
  const { data: row, error } = await db
    .from('professional_profiles')
    .insert({ user_id: userId, visibility: data.visibility })
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? 'No se pudo crear el perfil' };

  revalidateFeed();
  return { ok: true, data: toProfile(row as ProfileRow) };
}

export async function updateProfileAction(
  profileId: string,
  data: UpdateProfessionalProfileDTO,
): Promise<ActionResult<ProfessionalProfile>> {
  const { userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const db = getServiceClient();
  const update: Record<string, unknown> = {};
  if (data.visibility !== undefined) update.visibility = data.visibility;
  // Dual-write: la columna id-first (*_cloudflare_id) es la fuente de verdad;
  // avatar_url/cover_url se siguen escribiendo para lectores aún no migrados.
  // Retirar la escritura de URL es el follow-up una vez aplicada la migración.
  if (data.avatarUrl !== undefined) {
    update.avatar_url = data.avatarUrl || null;
    update.avatar_cloudflare_id = data.avatarCloudflareId ?? extractImageId(data.avatarUrl) ?? null;
  }
  if (data.coverUrl !== undefined) {
    update.cover_url = data.coverUrl || null;
    update.cover_cloudflare_id = data.coverCloudflareId ?? extractImageId(data.coverUrl) ?? null;
  }
  if (data.bio !== undefined) update.bio = data.bio || null;

  const runUpdate = (payload: Record<string, unknown>) =>
    db
      .from('professional_profiles')
      .update(payload)
      .eq('id', profileId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

  let { data: row, error } = await runUpdate(update);
  // Pre-migración: si las columnas *_cloudflare_id no existen aún, reintenta
  // escribiendo solo las columnas legadas de URL. PostgREST reporta la columna
  // desconocida del payload como PGRST204 (schema cache) o 42703 (Postgres).
  if (
    (error?.code === 'PGRST204' || error?.code === '42703') &&
    ('avatar_cloudflare_id' in update || 'cover_cloudflare_id' in update)
  ) {
    const legacyUpdate = { ...update };
    delete legacyUpdate.avatar_cloudflare_id;
    delete legacyUpdate.cover_cloudflare_id;
    ({ data: row, error } = await runUpdate(legacyUpdate));
  }
  if (error || !row) return { ok: false, error: error?.message ?? 'No se pudo actualizar el perfil' };

  revalidateFeed();
  return { ok: true, data: toProfile(row as ProfileRow) };
}

export async function deleteProfileAction(profileId: string): Promise<ActionResult> {
  const { userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const db = getServiceClient();
  const { error } = await db
    .from('professional_profiles')
    .delete()
    .eq('id', profileId)
    .eq('user_id', userId);
  if (error) return { ok: false, error: error.message };
  revalidateFeed();
  return { ok: true };
}

export async function followProfileAction(profileId: string): Promise<ActionResult> {
  const { userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const db = getServiceClient();
  const { error } = await db
    .from('professional_profile_follows')
    .upsert(
      { professional_profile_id: profileId, follower_id: userId },
      { onConflict: 'professional_profile_id,follower_id' },
    );
  if (error) return { ok: false, error: error.message };
  revalidateFeed();
  return { ok: true };
}

export async function unfollowProfileAction(profileId: string): Promise<ActionResult> {
  const { userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };

  const db = getServiceClient();
  const { error } = await db
    .from('professional_profile_follows')
    .delete()
    .eq('professional_profile_id', profileId)
    .eq('follower_id', userId);
  if (error) return { ok: false, error: error.message };
  revalidateFeed();
  return { ok: true };
}

export async function listPublicProfilesAction(
  limit = 24,
  offset = 0,
): Promise<{ profiles: ProfessionalProfile[]; total: number }> {
  return listPublicProfiles(limit, offset);
}

