'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import type {
  CreateFamilyDto,
  UpdateFamilyDto,
  AddPersonDto,
  UpdatePersonDto,
  InviteByUsernameDto,
  AddEventDto,
  AddPhotoDto,
  AddStoryDto,
  AddDocumentDto,
  SetMemberPermissionsDto,
  FamilyEventType,
  FamilyMemberRole,
  FamilyRelationshipKind,
} from '../types/family.types';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const MAX_FAMILIES_PER_OWNER = 5;
const MAX_INVITES_PER_HOUR = 20;

// Slugs that would shadow concrete /feed/familias/<route> pages.
// Keep in sync with directories under src/app/(app)/feed/familias/.
const RESERVED_FAMILY_SLUGS = new Set(['nueva', 'invitaciones']);

type Session = { userId: string; client: SupabaseClient };

async function requireSession(): Promise<Session | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  return { userId: data.user.id, client };
}

function familySlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      // Strip combining diacritical marks (U+0300–U+036F)
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'familia'
  );
}

// Revalidate the Familias listing and any [slug] page, without an extra DB
// hop to look up the slug. The 'page' selector tells Next to invalidate every
// rendered instance of the dynamic [slug] route.
function revalidateFamilyPaths() {
  revalidatePath('/feed/familias');
  revalidatePath('/feed/familias/[slug]', 'page');
}

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
  // check protects against shadowing a concrete /feed/familias/<route> page.
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

export async function setMemberPermissions(
  dto: SetMemberPermissionsDto,
): Promise<ActionResult<{ profileId: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const patch: Record<string, unknown> = {};
  if (dto.perms.canViewPersons !== undefined) patch.can_view_persons = dto.perms.canViewPersons;
  if (dto.perms.canViewEvents !== undefined) patch.can_view_events = dto.perms.canViewEvents;
  if (dto.perms.canViewPhotos !== undefined) patch.can_view_photos = dto.perms.canViewPhotos;
  if (dto.perms.canViewStories !== undefined) patch.can_view_stories = dto.perms.canViewStories;
  if (dto.perms.canViewDocuments !== undefined) patch.can_view_documents = dto.perms.canViewDocuments;
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No hay cambios.' };
  }

  // Upsert: si no existe la fila, crear; si existe, actualizar.
  const { error } = await session.client
    .from('family_member_permissions')
    .upsert(
      {
        family_id: dto.familyId,
        profile_id: dto.profileId,
        ...patch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'family_id,profile_id' },
    );
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { profileId: dto.profileId } };
}

export async function resetMemberPermissions(input: {
  familyId: string;
  profileId: string;
}): Promise<ActionResult<{ profileId: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  // Borrar la fila → defaults (todos true) aplican vía can_member_view.
  const { error } = await session.client
    .from('family_member_permissions')
    .delete()
    .eq('family_id', input.familyId)
    .eq('profile_id', input.profileId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { profileId: input.profileId } };
}

export async function deleteFamily(id: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { error } = await session.client.from('families').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id } };
}

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

export async function linkRelationship(input: {
  familyId: string;
  personId: string;
  relatedPersonId: string;
  type: FamilyRelationshipKind;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { data, error } = await session.client
    .from('family_relationships')
    .insert({
      family_id: input.familyId,
      person_id: input.personId,
      related_person_id: input.relatedPersonId,
      relationship_type: input.type,
      created_by: session.userId,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear la relación.' };
  revalidateFamilyPaths();
  return { ok: true, data: { id: data.id } };
}

export async function inviteToFamilyByUsername(
  dto: InviteByUsernameDto,
): Promise<ActionResult<{ invitationId: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { userId, client } = session;

  const username = (dto.username ?? '').trim().replace(/^@/, '');
  if (!username) return { ok: false, error: 'Username vacío.' };

  const { data: rateData } = await client.rpc('count_recent_family_invites', {
    p_inviter_id: userId,
  });
  const rateCount = Number(rateData ?? 0);
  if (rateCount >= MAX_INVITES_PER_HOUR) {
    return { ok: false, error: `Demasiadas invitaciones recientes (${rateCount}/h). Intenta más tarde.` };
  }

  const { data: profile } = await client
    .from('profiles')
    .select('id, username')
    .ilike('username', username)
    .maybeSingle();
  if (!profile) return { ok: false, error: 'Usuario no encontrado.' };
  const inviteeId = (profile as { id: string }).id;
  if (inviteeId === userId) return { ok: false, error: 'No puedes invitarte a ti mismo.' };

  const { data: existingMember } = await client
    .from('family_members')
    .select('id')
    .eq('family_id', dto.familyId)
    .eq('profile_id', inviteeId)
    .maybeSingle();
  if (existingMember) return { ok: false, error: 'Ya es miembro de la familia.' };

  const { data: existingInvite } = await client
    .from('family_invitations')
    .select('id')
    .eq('family_id', dto.familyId)
    .eq('invitee_id', inviteeId)
    .eq('status', 'pending')
    .maybeSingle();
  if (existingInvite) {
    return { ok: true, data: { invitationId: (existingInvite as { id: string }).id } };
  }

  const { data: invite, error } = await client
    .from('family_invitations')
    .insert({
      family_id: dto.familyId,
      invitee_id: inviteeId,
      invited_by: userId,
      person_id: dto.personId ?? null,
    })
    .select('id')
    .single();
  if (error || !invite) {
    return { ok: false, error: error?.message ?? 'No se pudo crear la invitación.' };
  }

  // Use after() so the Edge Function call survives the Server Action's
  // serverless context being torn down once we return. Awaiting would block
  // the user; fire-and-forget without after() risks the request dropping.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const internalSecret = process.env.EMAIL_WEBHOOK_SECRET;
  if (supabaseUrl && internalSecret) {
    after(async () => {
      try {
        await fetch(`${supabaseUrl}/functions/v1/notify-family-invitation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': internalSecret },
          body: JSON.stringify({ invitationId: invite.id }),
        });
      } catch (err) {
        console.error('[inviteToFamily] notify edge call failed:', err);
      }
    });
  }

  revalidateFamilyPaths();
  return { ok: true, data: { invitationId: invite.id } };
}

export async function acceptFamilyInvitation(
  invitationId: string,
): Promise<ActionResult<{ familyId: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { data, error } = await session.client.rpc('accept_family_invitation', {
    p_invitation_id: invitationId,
  });
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo aceptar la invitación.' };
  }
  revalidateFamilyPaths();
  return { ok: true, data: { familyId: data as string } };
}

export async function declineFamilyInvitation(
  invitationId: string,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { error } = await session.client
    .from('family_invitations')
    .update({ status: 'declined', responded_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('invitee_id', session.userId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: invitationId } };
}

export async function removeMember(input: {
  familyId: string;
  profileId: string;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  // Cannot kick the owner.
  const { data: fam } = await session.client
    .from('families')
    .select('owner_id')
    .eq('id', input.familyId)
    .maybeSingle();
  if (!fam) return { ok: false, error: 'Familia no encontrada.' };
  if ((fam as { owner_id: string }).owner_id === input.profileId) {
    return { ok: false, error: 'No puedes expulsar al dueño. Transfiere la propiedad primero.' };
  }

  const { error } = await session.client
    .from('family_members')
    .delete()
    .eq('family_id', input.familyId)
    .eq('profile_id', input.profileId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: input.profileId } };
}

export async function updateMemberRole(input: {
  familyId: string;
  profileId: string;
  role: Exclude<FamilyMemberRole, 'owner'>;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  // The owner role is only changed via transfer_family_ownership.
  const { data: fam } = await session.client
    .from('families')
    .select('owner_id')
    .eq('id', input.familyId)
    .maybeSingle();
  if (!fam) return { ok: false, error: 'Familia no encontrada.' };
  if ((fam as { owner_id: string }).owner_id === input.profileId) {
    return { ok: false, error: 'No puedes cambiar el rol del dueño.' };
  }

  const { error } = await session.client
    .from('family_members')
    .update({ role: input.role })
    .eq('family_id', input.familyId)
    .eq('profile_id', input.profileId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: input.profileId } };
}

export async function transferFamilyOwnership(input: {
  familyId: string;
  newOwnerProfileId: string;
}): Promise<ActionResult<{ familyId: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { error } = await session.client.rpc('transfer_family_ownership', {
    p_family_id: input.familyId,
    p_new_owner_id: input.newOwnerProfileId,
  });
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { familyId: input.familyId } };
}

export async function leaveFamily(familyId: string): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { userId, client } = session;

  const { data: fam } = await client
    .from('families')
    .select('owner_id')
    .eq('id', familyId)
    .maybeSingle();
  if (!fam) return { ok: false, error: 'Familia no encontrada.' };
  if ((fam as { owner_id: string }).owner_id === userId) {
    return { ok: false, error: 'El dueño no puede abandonar su familia. Transfiere o elimina.' };
  }
  const { error } = await client
    .from('family_members')
    .delete()
    .eq('family_id', familyId)
    .eq('profile_id', userId);
  if (error) return { ok: false, error: error.message };
  revalidateFamilyPaths();
  return { ok: true, data: { id: familyId } };
}

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

export async function addDocument(dto: AddDocumentDto): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  if (!dto.title?.trim()) return { ok: false, error: 'El título es obligatorio.' };
  if (!dto.storagePath && !dto.cfImageId) {
    return { ok: false, error: 'Sube un archivo (PDF) o una imagen.' };
  }
  if (dto.storagePath && dto.cfImageId) {
    return { ok: false, error: 'No puedes pasar PDF e imagen al mismo tiempo.' };
  }

  const { data, error } = await session.client
    .from('family_documents')
    .insert({
      family_id: dto.familyId,
      title: dto.title.trim(),
      kind: dto.kind,
      storage_path: dto.storagePath ?? null,
      cf_image_id: dto.cfImageId ?? null,
      uploaded_by: session.userId,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo guardar el documento.' };
  revalidateFamilyPaths();
  return { ok: true, data: { id: data.id } };
}

export async function getDocumentSignedUrl(
  documentId: string,
): Promise<ActionResult<{ url: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };

  const { data: doc } = await session.client
    .from('family_documents')
    .select('storage_path')
    .eq('id', documentId)
    .maybeSingle();
  const storagePath = (doc as { storage_path: string | null } | null)?.storage_path;
  if (!storagePath) {
    return { ok: false, error: 'Documento no encontrado o sin PDF asociado.' };
  }

  const { data: signed, error } = await session.client.storage
    .from('family-documents')
    .createSignedUrl(storagePath, 60);
  if (error || !signed?.signedUrl) {
    return { ok: false, error: error?.message ?? 'No se pudo firmar la URL.' };
  }
  return { ok: true, data: { url: signed.signedUrl } };
}
