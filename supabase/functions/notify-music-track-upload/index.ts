// Deno Edge Function: notify-music-track-upload
//
// Auth: X-Internal-Secret header must match EMAIL_WEBHOOK_SECRET (timing-safe).
// Body: { trackId: uuid, r2Key: string, contributorId?: uuid }
//
// Side effects:
//   1. HEADs the R2 object to validate it exists, recording size + content-type.
//   2. Writes an audit row to music_track_upload_audit with the outcome.
//   3. Returns 200 with { ok, validated, sizeBytes, contentType }.
//
// Why an Edge Function:
//   - Validation runs in a Deno sandbox isolated from the Next.js bundle.
//   - R2 credentials live only in Supabase function secrets, not Vercel env.
//   - Every upload is observable via the audit table without instrumenting the
//     Next.js server action.
//
// Invoked from the createTrack server action via after() (best-effort, never
// blocks the response to the user).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  S3Client,
  HeadObjectCommand,
} from 'npm:@aws-sdk/client-s3@3.1045.0';

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

type AuditOutcome =
  | 'upload_validated'
  | 'validation_failed'
  | 'notify_sent'
  | 'notify_failed'
  | 'orphan_detected';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const expectedSecret = Deno.env.get('EMAIL_WEBHOOK_SECRET');
  if (!expectedSecret) return json(500, { error: 'Server misconfigured: EMAIL_WEBHOOK_SECRET' });

  const presented = req.headers.get('X-Internal-Secret') ?? '';
  if (!timingSafeEqual(presented, expectedSecret)) return json(403, { error: 'Forbidden' });

  let body: { trackId?: unknown; r2Key?: unknown; contributorId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const trackId = typeof body.trackId === 'string' ? body.trackId : null;
  const r2Key = typeof body.r2Key === 'string' ? body.r2Key : '';
  const contributorId = typeof body.contributorId === 'string' ? body.contributorId : null;

  if (!r2Key) return json(400, { error: 'r2Key required' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) return json(500, { error: 'Server misconfigured' });

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const writeAudit = async (
    outcome: AuditOutcome,
    detail: string | null,
    contentType: string | null,
    sizeBytes: number | null,
  ) => {
    try {
      await sb.from('music_track_upload_audit').insert({
        track_id: trackId,
        r2_key: r2Key,
        contributor_id: contributorId,
        outcome,
        detail,
        content_type: contentType,
        size_bytes: sizeBytes,
      });
    } catch (err) {
      console.error('[notify-music-track-upload] audit insert failed:', err);
    }
  };

  // Validate the R2 object exists and capture metadata.
  const r2Endpoint = Deno.env.get('R2_ENDPOINT');
  const r2Bucket = Deno.env.get('R2_BUCKET');
  const r2AccessKey = Deno.env.get('R2_ACCESS_KEY_ID');
  const r2SecretKey = Deno.env.get('R2_SECRET_ACCESS_KEY');

  let validated = false;
  let contentType: string | null = null;
  let sizeBytes: number | null = null;
  let detail: string | null = null;

  if (r2Endpoint && r2Bucket && r2AccessKey && r2SecretKey) {
    try {
      const s3 = new S3Client({
        region: 'auto',
        endpoint: r2Endpoint,
        credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
      });
      const res = await s3.send(
        new HeadObjectCommand({ Bucket: r2Bucket, Key: r2Key }),
      );
      validated = true;
      contentType = res.ContentType ?? null;
      sizeBytes = typeof res.ContentLength === 'number' ? res.ContentLength : null;
      await writeAudit('upload_validated', null, contentType, sizeBytes);
    } catch (err) {
      detail = err instanceof Error ? err.message : String(err);
      await writeAudit(
        trackId ? 'validation_failed' : 'orphan_detected',
        detail,
        null,
        null,
      );
      return json(200, {
        ok: true,
        validated: false,
        reason: 'r2_head_failed',
        detail,
      });
    }
  } else {
    // Edge function R2 secrets not configured — skip validation but still
    // record the upload event so we have a trail.
    await writeAudit('notify_sent', 'r2_secrets_missing_in_edge_runtime', null, null);
  }

  return json(200, { ok: true, validated, contentType, sizeBytes });
});
