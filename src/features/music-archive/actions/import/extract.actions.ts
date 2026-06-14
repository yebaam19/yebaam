'use server';

import { getServiceClient } from '@/utils/supabase/server';
import {
  detectSource,
  extractMusicFromUrl,
} from '../../server/music.importer';
import { requirePlatformAdmin } from '../../server/music.server';
import type { ExtractedImportPreview } from '../../types/music.types';
import type { ActionResult } from '../_shared';

export async function extractFromUrl(
  url: string,
): Promise<ActionResult<ExtractedImportPreview>> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { ok: false, error: 'Solo administradores pueden importar.' };

  try {
    new URL(url);
  } catch {
    return { ok: false, error: 'URL inválida.' };
  }

  // Skip if this URL was already imported.
  const service = getServiceClient();
  const { data: existing } = await service
    .from('music_imports')
    .select('id, status')
    .eq('source_url', url)
    .eq('status', 'imported')
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      error: 'Esta URL ya fue importada anteriormente. Mira la lista de imports debajo.',
    };
  }

  let result: Awaited<ReturnType<typeof extractMusicFromUrl>>;
  try {
    result = await extractMusicFromUrl(url);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    // Record failure too, for audit.
    await service.from('music_imports').insert({
      source: detectSource(url),
      source_url: url,
      status: 'failed',
      error_detail: detail,
      imported_by: admin.userId,
    });
    return { ok: false, error: detail };
  }

  // Persist the preview as a `pending` row so confirm doesn't re-call Firecrawl.
  const { data: row, error } = await service
    .from('music_imports')
    .insert({
      source: result.source,
      source_url: url,
      status: 'pending',
      detected_metadata: result.detected,
      imported_by: admin.userId,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    data: {
      importId: (row as { id: string }).id,
      source: result.source,
      source_url: url,
      detected: result.detected,
    },
  };
}

