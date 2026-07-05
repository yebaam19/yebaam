'use server';

import { getServerClient } from '@/utils/supabase/server';
import { deleteImage } from '@/lib/cloudflare/images';
import { deleteStreamVideo } from '@/lib/cloudflare/stream';

/**
 * Server Actions for profile gallery media.
 *
 * `supabase.storage.remove()` no-ops against the pseudo-buckets
 * 'cloudflare-images' / 'cloudflare-stream' (they don't exist in Supabase
 * Storage), which orphaned every deleted Cloudflare asset. This action does
 * the real Cloudflare API delete server-side. The row itself is deleted by
 * the caller under RLS; here we only verify ownership and delete the asset.
 */

export type DeleteProfileMediaAssetResult = { ok: true } | { ok: false; error: string };

const TABLE_BY_KIND = {
  photo: 'profile_photos',
  video: 'profile_videos',
} as const;

type MediaKind = keyof typeof TABLE_BY_KIND;

export async function deleteProfileMediaAsset(
  kind: MediaKind,
  mediaId: string,
): Promise<DeleteProfileMediaAssetResult> {
  const table = TABLE_BY_KIND[kind];
  if (!table || typeof mediaId !== 'string' || !mediaId) {
    return { ok: false, error: 'Solicitud inválida' };
  }

  const client = await getServerClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { ok: false, error: 'No autenticado' };

  // Never trust a client-supplied bucket/key — read them from the row and
  // verify the caller owns it before touching the Cloudflare asset.
  const { data, error } = await client
    .from(table)
    .select('user_id, storage_bucket, storage_key')
    .eq('id', mediaId)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'Elemento no encontrado' };

  const row = data as { user_id: string; storage_bucket: string | null; storage_key: string | null };
  if (row.user_id !== userId) {
    return { ok: false, error: 'Sin permiso para eliminar este elemento' };
  }
  if (!row.storage_key) return { ok: true };

  try {
    if (row.storage_bucket === 'cloudflare-images') {
      await deleteImage(row.storage_key);
    } else if (row.storage_bucket === 'cloudflare-stream') {
      await deleteStreamVideo(row.storage_key);
    }
    // Legacy buckets are handled client-side via supabase.storage.remove().
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'No se pudo eliminar el archivo de Cloudflare',
    };
  }
}
