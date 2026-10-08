import 'server-only';
import type { z } from 'zod';
import { getServiceClient } from '@/utils/supabase/server';
import { getImageProvenance, isCloudflareImageId } from '@/lib/cloudflare/images';
import { getStreamVideo, isStreamUid } from '@/lib/cloudflare/stream';
import { headFile } from '@/lib/cloudflare/r2';
import type { finalizeAssetSchema } from '../schemas/communityLibrary.schema';

export async function validateAssetUpload(userId: string, value: z.infer<typeof finalizeAssetSchema>) {
  if (value.kind === 'image') {
    if (!isCloudflareImageId(value.mediaId) || !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(value.contentType)) {
      throw new Error('Formato de imagen no compatible.');
    }
    const image = await getImageProvenance(value.mediaId);
    if (!image?.ready || image.requiresSignature || image.uploadedBy !== userId || image.source !== `community-library:${value.communityId}`) {
      throw new Error('No se pudo verificar la imagen.');
    }
    return { mediaId: value.mediaId, fileName: value.fileName, contentType: value.contentType, sizeBytes: null, duration: null };
  }
  if (value.kind === 'video') {
    if (!isStreamUid(value.mediaId) || !['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska'].includes(value.contentType)) {
      throw new Error('Formato de video no compatible.');
    }
    const video = await getStreamVideo(value.mediaId);
    if (!video.readyToStream || video.meta?.uploadedBy !== userId || video.meta?.source !== `community-library:${value.communityId}`) {
      throw new Error('El video no está listo o no pertenece a esta biblioteca.');
    }
    return { mediaId: value.mediaId, fileName: value.fileName, contentType: value.contentType, sizeBytes: null, duration: video.duration };
  }
  // mediaId is the ledger UUID, never a caller-supplied R2 path.
  if (value.mediaId !== value.id) throw new Error('Identificador de carga no válido.');
  const service = getServiceClient();
  const { data: receipt, error } = await service.from('community_document_uploads')
    .select('object_key,content_type,size_bytes,original_name').eq('id', value.id)
    .eq('community_id', value.communityId).eq('uploaded_by', userId).maybeSingle();
  if (error || !receipt) throw new Error('No se encontró la carga del documento.');
  const object = await headFile(receipt.object_key);
  if (!object.exists || object.sizeBytes !== receipt.size_bytes || object.contentType !== receipt.content_type) {
    throw new Error('El documento no terminó de subir o no coincide con el archivo declarado.');
  }
  return { mediaId: receipt.object_key as string, fileName: receipt.original_name as string,
    contentType: receipt.content_type as string, sizeBytes: object.sizeBytes, duration: null };
}
