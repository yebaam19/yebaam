// Cron-triggered hard cleanup of expired stories.
// Auth: X-Cron-Secret header must match CRON_SECRET env var (constant-time compared).
//
// Delete is performed via the SECURITY DEFINER function
// public.cleanup_expired_stories(), which bypasses RLS and returns the
// removed rows. Media assets are then best-effort removed per row:
//   - cloudflare_stream_uid  → DELETE Cloudflare Stream video
//   - cloudflare_image_id    → DELETE Cloudflare Images image
//   - legacy storage path    → storage.from('stories').remove (pre-Cloudflare rows;
//                              a key counts as a storage path only if it contains '/'
//                              and is not a full http(s) URL — new rows store the CF
//                              delivery URL in media_url, which must NOT hit storage)
//
// Tolerates the pre-migration RPC shape (no deleted_image_id / deleted_stream_uid
// columns): those rows fall through to the media-key branch and, if unclassifiable,
// are counted as skipped rather than aborting the batch.
//
// Env (Supabase function secrets):
//   CRON_SECRET                       — shared secret with the cron caller
//   SUPABASE_URL / SERVICE_ROLE_KEY   — injected by the platform
//   CLOUDFLARE_ACCOUNT_ID             — CF account for Images/Stream deletes
//   CLOUDFLARE_API_TOKEN              — CF API token with Images+Stream edit perms
// If the Cloudflare pair is missing, rows are still deleted from the DB but CF
// asset cleanup is skipped (logged loudly — assets orphan until secrets are set).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

type DeletedRow = {
  deleted_id: string;
  deleted_media_key: string | null;
  // Present only once the extended cleanup_expired_stories() migration is applied.
  deleted_image_id?: string | null;
  deleted_stream_uid?: string | null;
};

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Legacy Supabase Storage keys look like 'userId/file.ext' — never a full URL. */
function isLegacyStoragePath(key: string): boolean {
  return key.includes('/') && !/^https?:\/\//i.test(key);
}

/**
 * Issues a Cloudflare DELETE. 404 counts as success — the asset is already
 * gone and the cleanup is idempotent across retries.
 */
async function cfDelete(url: string, token: string, label: string): Promise<boolean> {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok || res.status === 404) return true;
  const detail = await res.text().catch(() => '');
  console.error(`[story-cleanup] Cloudflare ${label} delete failed`, res.status, detail);
  return false;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const expectedSecret = Deno.env.get('CRON_SECRET');
  if (!expectedSecret) {
    console.error('[story-cleanup] CRON_SECRET not configured');
    return json(500, { error: 'Server misconfigured' });
  }

  const presentedSecret = req.headers.get('X-Cron-Secret') ?? '';
  if (!timingSafeEqual(presentedSecret, expectedSecret)) {
    return json(403, { error: 'Forbidden' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[story-cleanup] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
    return json(500, { error: 'Server misconfigured' });
  }

  const cfAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID') ?? '';
  const cfApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN') ?? '';
  const cfConfigured = Boolean(cfAccountId && cfApiToken);
  if (!cfConfigured) {
    console.error(
      '[story-cleanup] CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN not set — ' +
        'DB rows will be deleted but Cloudflare assets will be ORPHANED. ' +
        'Set both as function secrets to enable CF cleanup.',
    );
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // The RPC returns the list of deleted rows so we know which media assets
  // to remove. Errors here are terminal — we can't safely continue to the
  // media step if we don't know what got deleted.
  const { data: rpcData, error: rpcErr } = await client.rpc('cleanup_expired_stories');
  if (rpcErr) {
    console.error('[story-cleanup] rpc failed', rpcErr);
    return json(500, { error: 'Cleanup failed' });
  }

  const deleted = (rpcData as DeletedRow[] | null) ?? [];

  // Best-effort media cleanup. A failure per row is logged but doesn't fail
  // the run — the row is already gone from the DB.
  let cfImagesDeleted = 0;
  let cfStreamDeleted = 0;
  let legacyRemoved = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of deleted) {
    try {
      const streamUid = row.deleted_stream_uid ?? null;
      const imageId = row.deleted_image_id ?? null;

      if (streamUid) {
        if (!cfConfigured) {
          skipped++;
          continue;
        }
        const ok = await cfDelete(
          `${CF_API_BASE}/accounts/${cfAccountId}/stream/${encodeURIComponent(streamUid)}`,
          cfApiToken,
          'Stream',
        );
        if (ok) cfStreamDeleted++;
        else failed++;
        continue;
      }

      if (imageId) {
        if (!cfConfigured) {
          skipped++;
          continue;
        }
        const ok = await cfDelete(
          `${CF_API_BASE}/accounts/${cfAccountId}/images/v1/${encodeURIComponent(imageId)}`,
          cfApiToken,
          'Images',
        );
        if (ok) cfImagesDeleted++;
        else failed++;
        continue;
      }

      const mediaKey = row.deleted_media_key;
      if (!mediaKey) continue; // text-only story — nothing to clean

      if (isLegacyStoragePath(mediaKey)) {
        const { error: rmErr } = await client.storage.from('stories').remove([mediaKey]);
        if (rmErr) {
          console.error('[story-cleanup] storage.remove failed', mediaKey, rmErr);
          failed++;
        } else {
          legacyRemoved++;
        }
        continue;
      }

      // Bare id or full delivery URL with no CF column (pre-migration RPC
      // shape) — nothing we can delete safely. Logged so orphans are visible.
      console.warn('[story-cleanup] unclassifiable media key, skipping', row.deleted_id, mediaKey);
      skipped++;
    } catch (err) {
      console.error('[story-cleanup] row cleanup failed', row.deleted_id, err);
      failed++;
    }
  }

  const summary = {
    dbDeleted: deleted.length,
    cfImagesDeleted,
    cfStreamDeleted,
    legacyRemoved,
    skipped,
    failed,
  };
  console.log('[story-cleanup] done', summary);

  return json(200, { ok: true, at: new Date().toISOString(), ...summary });
});
