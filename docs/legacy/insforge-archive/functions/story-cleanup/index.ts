// Cron-triggered hard cleanup of expired stories.
// Auth: X-Cron-Secret header must match CRON_SECRET env var (constant-time compared).
//
// Delete is performed via the SECURITY DEFINER function cleanup_expired_stories(),
// which bypasses RLS and returns the list of {id, media_key} rows it removed.
// Storage objects are then best-effort removed per row.

import { createClient } from 'npm:@insforge/sdk';

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

export default async function (req: Request): Promise<Response> {
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

  const baseUrl = Deno.env.get('INSFORGE_BASE_URL');
  const anonKey = Deno.env.get('ANON_KEY');
  if (!baseUrl || !anonKey) {
    console.error('[story-cleanup] INSFORGE_BASE_URL or ANON_KEY missing');
    return json(500, { error: 'Server misconfigured' });
  }

  // Invoke the RPC via the REST endpoint. The SDK's rpc surface isn't
  // needed — a raw POST to the PostgREST-compatible RPC path is simpler
  // and keeps the dependency surface minimal.
  let rpcResp: Response;
  try {
    rpcResp = await fetch(`${baseUrl}/api/database/rpc/cleanup_expired_stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: '{}',
    });
  } catch (err) {
    console.error('[story-cleanup] rpc fetch failed', err);
    return json(500, { error: 'Cleanup failed' });
  }

  if (!rpcResp.ok) {
    const text = await rpcResp.text().catch(() => '');
    console.error('[story-cleanup] rpc returned', rpcResp.status, text);
    return json(500, { error: 'Cleanup failed' });
  }

  const deleted = ((await rpcResp.json().catch(() => [])) as DeletedRow[]) ?? [];

  const client = createClient({ baseUrl, anonKey });

  let storageOk = 0;
  let storageFailed = 0;
  for (const row of deleted) {
    if (!row.deleted_media_key) continue;
    const { error: rmErr } = await client.storage
      .from('stories')
      .remove(row.deleted_media_key);
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
}
