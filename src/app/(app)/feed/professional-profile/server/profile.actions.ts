'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import type {
  CreateProfessionalProfileDTO,
  ProfessionalProfile,
  ProfessionalProfileVisibility,
  UpdateProfessionalProfileDTO,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';
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

function mapCreatedRow(row: {
  id: string;
  user_id: string;
  visibility: ProfessionalProfileVisibility;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}): ProfessionalProfile {
  return {
    id: row.id,
    userId: row.user_id,
    visibility: row.visibility,
    avatarUrl: row.avatar_url,
    coverUrl: row.cover_url,
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
  return { ok: true, data: mapCreatedRow(row as Parameters<typeof mapCreatedRow>[0]) };
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
  if (data.avatarUrl !== undefined) update.avatar_url = data.avatarUrl || null;
  if (data.coverUrl !== undefined) update.cover_url = data.coverUrl || null;
  if (data.bio !== undefined) update.bio = data.bio || null;

  const { data: row, error } = await db
    .from('professional_profiles')
    .update(update)
    .eq('id', profileId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();
  if (error || !row) return { ok: false, error: error?.message ?? 'No se pudo actualizar el perfil' };

  revalidateFeed();
  return { ok: true, data: mapCreatedRow(row as Parameters<typeof mapCreatedRow>[0]) };
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

export async function uploadProfileImageAction(
  formData: FormData,
  kind: 'avatar' | 'cover',
): Promise<ActionResult<{ url: string }>> {
  const { userId } = await requireUser();
  if (!userId) return { ok: false, error: 'No autenticado' };
  const client = getServiceClient();

  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'Archivo inválido' };

  const maxBytes = (kind === 'avatar' ? 5 : 10) * 1024 * 1024;
  if (file.size > maxBytes) return { ok: false, error: `El archivo supera ${maxBytes / (1024 * 1024)}MB` };
  if (!file.type.startsWith('image/')) return { ok: false, error: 'Debe ser una imagen' };

  const bucket = kind === 'avatar' ? 'avatars' : 'covers';
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
  const key = `${userId}/professional-${kind}-${Date.now()}${ext}`;

  const { error: uploadError } = await client.storage.from(bucket).upload(key, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data } = client.storage.from(bucket).getPublicUrl(key);
  return { ok: true, data: { url: data.publicUrl } };
}
