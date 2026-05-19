'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient } from '@/utils/supabase/server';
import { listPetsForProfile, getPetWithMedia } from '../server/pets.server';
import {
  addPetPhotoSchema,
  addPetVideoSchema,
  createPetSchema,
  updatePetSchema,
  type AddPetPhotoInput,
  type AddPetVideoInput,
  type CreatePetInput,
  type UpdatePetInput,
} from '../validators/pet.schema';
import type { PetRow, PetWithMedia } from '../types/pet.types';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const MAX_PETS_PER_OWNER = 20;
const MAX_PHOTOS_PER_PET = 40;
const MAX_VIDEOS_PER_PET = 10;

type Session = { userId: string; client: SupabaseClient };

async function requireSession(): Promise<Session | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  return { userId: data.user.id, client };
}

function petSlugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'mascota'
  );
}

async function uniqueSlugForOwner(
  client: SupabaseClient,
  ownerId: string,
  base: string,
): Promise<string> {
  let slug = base;
  for (let i = 2; i < 100; i += 1) {
    const { data } = await client
      .from('pets')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('slug', slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

function revalidatePetPaths(username?: string | null) {
  // Profile page is mounted at /[username]; "page" mode revalidates every
  // rendered instance of the dynamic segment so we don't need to look the
  // username up just to invalidate the cache.
  revalidatePath('/[username]', 'page');
  if (username) revalidatePath(`/${username}`);
}

export async function createPet(input: CreatePetInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const parsed = createPetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' };
  const dto = parsed.data;

  const { count } = await session.client
    .from('pets')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', session.userId);
  if ((count ?? 0) >= MAX_PETS_PER_OWNER) {
    return { ok: false, error: `Solo puedes crear hasta ${MAX_PETS_PER_OWNER} mascotas.` };
  }

  const baseSlug = petSlugify(dto.name);
  const slug = await uniqueSlugForOwner(session.client, session.userId, baseSlug);

  const { data, error } = await session.client
    .from('pets')
    .insert({
      owner_id: session.userId,
      slug,
      name: dto.name,
      species: dto.species,
      breed: dto.breed ?? null,
      sex: dto.sex ?? 'unknown',
      date_of_birth: dto.dateOfBirth ?? null,
      color: dto.color ?? null,
      weight_kg: dto.weightKg ?? null,
      microchip_id: dto.microchipId ?? null,
      is_vaccinated: dto.isVaccinated ?? false,
      is_sterilized: dto.isSterilized ?? false,
      allergies: dto.allergies ?? null,
      vet_contact: dto.vetContact ?? null,
      about: dto.about ?? null,
      cover_cf_image_id: dto.coverCfImageId ?? null,
      privacy: dto.privacy ?? 'public',
    })
    .select('id, slug')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear la mascota.' };
  revalidatePetPaths();
  return { ok: true, data: { id: data.id, slug: data.slug } };
}

export async function updatePet(input: UpdatePetInput): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const parsed = updatePetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' };
  const dto = parsed.data;

  const patch: Record<string, unknown> = {};
  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.species !== undefined) patch.species = dto.species;
  if (dto.breed !== undefined) patch.breed = dto.breed;
  if (dto.sex !== undefined) patch.sex = dto.sex;
  if (dto.dateOfBirth !== undefined) patch.date_of_birth = dto.dateOfBirth;
  if (dto.color !== undefined) patch.color = dto.color;
  if (dto.weightKg !== undefined) patch.weight_kg = dto.weightKg;
  if (dto.microchipId !== undefined) patch.microchip_id = dto.microchipId;
  if (dto.isVaccinated !== undefined) patch.is_vaccinated = dto.isVaccinated;
  if (dto.isSterilized !== undefined) patch.is_sterilized = dto.isSterilized;
  if (dto.allergies !== undefined) patch.allergies = dto.allergies;
  if (dto.vetContact !== undefined) patch.vet_contact = dto.vetContact;
  if (dto.about !== undefined) patch.about = dto.about;
  if (dto.coverCfImageId !== undefined) patch.cover_cf_image_id = dto.coverCfImageId;
  if (dto.privacy !== undefined) patch.privacy = dto.privacy;
  if (Object.keys(patch).length === 0) return { ok: false, error: 'No hay cambios.' };

  const { error } = await session.client.from('pets').update(patch).eq('id', dto.id);
  if (error) return { ok: false, error: error.message };
  revalidatePetPaths();
  return { ok: true, data: { id: dto.id } };
}

export async function deletePet(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { error } = await session.client.from('pets').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePetPaths();
  return { ok: true, data: { id } };
}

export async function attachPetPhoto(
  input: AddPetPhotoInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const parsed = addPetPhotoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' };
  const dto = parsed.data;

  const { count } = await session.client
    .from('pet_photos')
    .select('id', { count: 'exact', head: true })
    .eq('pet_id', dto.petId);
  if ((count ?? 0) >= MAX_PHOTOS_PER_PET) {
    return { ok: false, error: `Máximo ${MAX_PHOTOS_PER_PET} fotos por mascota.` };
  }

  const { data, error } = await session.client
    .from('pet_photos')
    .insert({
      pet_id: dto.petId,
      cf_image_id: dto.cfImageId,
      caption: dto.caption ?? null,
      uploaded_by: session.userId,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo guardar la foto.' };
  revalidatePetPaths();
  return { ok: true, data: { id: data.id } };
}

export async function removePetPhoto(photoId: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { error } = await session.client.from('pet_photos').delete().eq('id', photoId);
  if (error) return { ok: false, error: error.message };
  revalidatePetPaths();
  return { ok: true, data: { id: photoId } };
}

export async function attachPetVideo(
  input: AddPetVideoInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const parsed = addPetVideoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos inválidos.' };
  const dto = parsed.data;

  const { count } = await session.client
    .from('pet_videos')
    .select('id', { count: 'exact', head: true })
    .eq('pet_id', dto.petId);
  if ((count ?? 0) >= MAX_VIDEOS_PER_PET) {
    return { ok: false, error: `Máximo ${MAX_VIDEOS_PER_PET} videos por mascota.` };
  }

  const { data, error } = await session.client
    .from('pet_videos')
    .insert({
      pet_id: dto.petId,
      cf_stream_uid: dto.cfStreamUid,
      thumbnail_cf_image_id: dto.thumbnailCfImageId ?? null,
      caption: dto.caption ?? null,
      uploaded_by: session.userId,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo guardar el video.' };
  revalidatePetPaths();
  return { ok: true, data: { id: data.id } };
}

export async function removePetVideo(videoId: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { error } = await session.client.from('pet_videos').delete().eq('id', videoId);
  if (error) return { ok: false, error: error.message };
  revalidatePetPaths();
  return { ok: true, data: { id: videoId } };
}

// Client-callable wrappers around the cached server reads, mirroring the
// `getFamiliesForProfileAction` shape that UserFamilies consumes.
export async function getPetsForProfileAction(profileId: string): Promise<ActionResult<PetRow[]>> {
  const data = await listPetsForProfile(profileId);
  return { ok: true, data };
}

export async function getPetWithMediaAction(petId: string): Promise<ActionResult<PetWithMedia | null>> {
  const data = await getPetWithMedia(petId);
  return { ok: true, data };
}

export interface PetLinkPreview {
  href: string;
  ownerUsername: string;
  petName: string;
  species: string;
  breed: string | null;
  coverCfImageId: string | null;
}

// Lightweight preview lookup for posts that embed a pet link.
// Returns null when the viewer cannot see the pet (RLS) — caller falls back
// to a plain styled link, matching the article-preview pattern.
export async function getPetPreviewByUsernameAndSlug(
  username: string,
  slug: string,
): Promise<PetLinkPreview | null> {
  const cleanUsername = username.toLowerCase();
  const cleanSlug = slug.toLowerCase();
  const client = await getServerClient();

  const { data: profile } = await client
    .from('profiles')
    .select('id, username')
    .eq('username', cleanUsername)
    .maybeSingle();
  const ownerId = (profile as { id: string; username: string } | null)?.id;
  if (!ownerId) return null;

  const { data: pet } = await client
    .from('pets')
    .select('name, species, breed, cover_cf_image_id, slug')
    .eq('owner_id', ownerId)
    .eq('slug', cleanSlug)
    .maybeSingle();
  if (!pet) return null;

  const row = pet as {
    name: string;
    species: string;
    breed: string | null;
    cover_cf_image_id: string | null;
    slug: string;
  };

  return {
    href: `/${cleanUsername}?tab=mascotas&pet=${row.slug}`,
    ownerUsername: cleanUsername,
    petName: row.name,
    species: row.species,
    breed: row.breed,
    coverCfImageId: row.cover_cf_image_id,
  };
}
