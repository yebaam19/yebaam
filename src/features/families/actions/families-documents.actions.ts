'use server';

import { getPublicFileUrl, headFile } from '@/lib/cloudflare/r2';
import { MAX_DOCUMENT_BYTES } from '@/lib/upload-limits';
import { isFamilyDocumentReference } from '../lib/document-storage';
import { canUploadFamilyDocument } from '../server/document-upload.server';
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

  if (dto.storagePath) {
    if (!isFamilyDocumentReference(dto.storagePath, session.userId, dto.familyId)) {
      return { ok: false, error: 'El documento no pertenece a esta carga.' };
    }
    if (!await canUploadFamilyDocument(session, dto.familyId)) {
      return { ok: false, error: 'No tienes permiso para subir documentos a esta familia.' };
    }
    const file = await headFile(dto.storagePath.slice(3));
    if (!file.exists || file.contentType !== 'application/pdf' || file.sizeBytes <= 0 || file.sizeBytes > MAX_DOCUMENT_BYTES) {
      return { ok: false, error: 'El PDF no se cargó correctamente.' };
    }
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
    .select('storage_path, family_id, uploaded_by')
    .eq('id', documentId)
    .maybeSingle();
  const storagePath = doc?.storage_path as string | null | undefined;
  if (!storagePath) {
    return { ok: false, error: 'Documento no encontrado o sin PDF asociado.' };
  }

  // Legacy documents stay readable; new documents contain an R2 object key.
  if (storagePath.startsWith('r2:')) {
    if (!doc || !isFamilyDocumentReference(storagePath, doc.uploaded_by, doc.family_id)) {
      return { ok: false, error: 'La referencia del documento no es válida.' };
    }
    try {
      return { ok: true, data: { url: await getPublicFileUrl(storagePath.slice(3), 60) } };
    } catch {
      return { ok: false, error: 'No se pudo firmar la URL.' };
    }
  }

  const { data: signed, error } = await session.client.storage
    .from('family-documents')
    .createSignedUrl(storagePath, 60);
  if (error || !signed?.signedUrl) {
    return { ok: false, error: error?.message ?? 'No se pudo firmar la URL.' };
  }
  return { ok: true, data: { url: signed.signedUrl } };
}
