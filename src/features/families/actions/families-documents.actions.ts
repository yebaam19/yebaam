'use server';

import type {
AddDocumentDto
} from '../types/family.types';
import { ActionResult,requireSession,revalidateFamilyPaths } from './families-helpers';

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
