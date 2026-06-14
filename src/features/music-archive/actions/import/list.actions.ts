'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { requirePlatformAdmin } from '../../server/music.server';
import type { MusicImportSource } from '../../types/music.types';
import type { ActionResult } from '../_shared';

export async function listRecentImports(limit = 50): Promise<
  ActionResult<
    Array<{
      id: string;
      source: MusicImportSource;
      source_url: string;
      status: string;
      created_album_id: string | null;
      error_detail: string | null;
      created_at: string;
    }>
  >
> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { ok: false, error: 'Solo administradores.' };
  const service = getServiceClient();
  const { data, error } = await service
    .from('music_imports')
    .select('id, source, source_url, status, created_album_id, error_detail, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as never };
}

