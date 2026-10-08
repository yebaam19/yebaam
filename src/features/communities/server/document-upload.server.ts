import 'server-only';
import type { z } from 'zod';
import { getServiceClient } from '@/utils/supabase/server';
import { getPresignedUploadUrl } from '@/lib/cloudflare/r2';
import { documentExtension } from '@/lib/upload-documents';
import { documentUploadSchema } from '../schemas/communityLibrary.schema';
import type { Session } from '../actions/_shared';

/** Call only after requireProfileSession(..., 'content'). The privileged ledger is never browser-writable. */
export async function signCommunityDocument(session: Session, value: z.infer<typeof documentUploadSchema>) {
  const service = getServiceClient();
  const key = `${session.userId}/communities/${value.communityId}/${value.uploadId}.${documentExtension(value.contentType)}`;
  const ledger = { id: value.uploadId, community_id: value.communityId, uploaded_by: session.userId,
    object_key: key, content_type: value.contentType, size_bytes: value.sizeBytes, original_name: value.fileName };
  // Reissuing a signature uses the same record/key; a dropped PUT does not create another file.
  const { error: insertError } = await service.from('community_document_uploads').insert(ledger);
  if (insertError && insertError.code !== '23505') throw new Error('No se pudo preparar la carga.');
  const { data, error } = await service.from('community_document_uploads')
    .select('object_key,content_type,size_bytes,original_name,finalized_asset_id')
    .eq('id', value.uploadId).eq('community_id', value.communityId).eq('uploaded_by', session.userId).maybeSingle();
  if (error || !data || data.object_key !== key || data.content_type !== value.contentType
    || data.size_bytes !== value.sizeBytes || data.original_name !== value.fileName || data.finalized_asset_id) {
    throw new Error('Esta carga ya terminó o corresponde a otro archivo. Selecciona el archivo de nuevo.');
  }
  const { url } = await getPresignedUploadUrl(key, value.contentType, 300, value.sizeBytes);
  return { url, key };
}
