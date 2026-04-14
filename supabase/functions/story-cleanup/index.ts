// Cron-triggered hard cleanup of expired stories.
// Auth: X-Cron-Secret header must match CRON_SECRET env var (constant-time compared).
//
// Delete is performed via the SECURITY DEFINER function
// public.cleanup_expired_stories(), which bypasses RLS and returns the
// (id, media_key) rows it removed. Storage objects are then best-effort
// removed per row.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

type DeletedRow = { deleted_id: string; deleted_media_key: string | null };

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

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // The RPC returns the list of deleted rows so we know which storage
  // objects to remove. Errors here are terminal — we can't safely
  // continue to the storage step if we don't know what got deleted.
  const { data: rpcData, error: rpcErr } = await client.rpc('cleanup_expired_stories');
  if (rpcErr) {
    console.error('[story-cleanup] rpc failed', rpcErr);
    return json(500, { error: 'Cleanup failed' });
  }

  const deleted = (rpcData as DeletedRow[] | null) ?? [];

  // Best-effort storage cleanup. A failure per object is logged but
  // doesn't fail the run — the row is already gone from the DB.
  let storageOk = 0;
  let storageFailed = 0;
  for (const row of deleted) {
    if (!row.deleted_media_key) continue;
    const { error: rmErr } = await client.storage.from('stories').remove([row.deleted_media_key]);
    if (rmErr) {
      console.error('[story-cleanup] storage.remove failed', row.deleted_media_key, rmErr);
      storageFailed++;
    } else {
      storageOk++;
    }
  }

  return json(200, {
    ok: true,
    at: new Date().toISOString(),
    dbDeleted: deleted.length,
    storageOk,
    storageFailed,
  });
});
