import 'server-only';
import { getImageProvenance, isCloudflareImageId } from '@/lib/cloudflare/images';
import { getServiceClient } from '@/utils/supabase/server';

/** Record only a ready, public Cloudflare image uploaded by the verified caller. */
export async function registerCommunityHeaderImage(imageId: string, userId: string): Promise<boolean> {
  if (!isCloudflareImageId(imageId)) return false;
  try {
    const image = await getImageProvenance(imageId);
    if (!image?.ready || image.requiresSignature || image.uploadedBy !== userId) return false;
    const client = getServiceClient();
    const { error } = await client.from('community_header_image_receipts')
      .insert({ image_id: imageId, uploaded_by: userId });
    if (!error) return true;
    if (error.code !== '23505') return false;
    const existing = await client.from('community_header_image_receipts')
      .select('uploaded_by').eq('image_id', imageId).maybeSingle();
    return !existing.error && existing.data?.uploaded_by === userId;
  } catch { return false; }
}
