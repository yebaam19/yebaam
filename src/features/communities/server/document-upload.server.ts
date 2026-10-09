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
  // DB time and row locking prevent a reissued PUT from racing orphan cleanup.
  const { data, error } = await service.rpc('prepare_community_document_upload', {
    target_community: value.communityId, actor: session.userId, upload_id: value.uploadId,
    object_key: key, mime_type: value.contentType, byte_size: value.sizeBytes, original_name: value.fileName,
  });
  if (error || data !== true) {
    throw new Error('Esta carga ya terminó o corresponde a otro archivo. Selecciona el archivo de nuevo.');
  }
  const { url } = await getPresignedUploadUrl(key, value.contentType, 300, value.sizeBytes);
  return { url, key };
}
