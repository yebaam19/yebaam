// Notifies all platform_admins when a user submits a profile-verification request.
// Auth: X-Internal-Secret must equal EMAIL_WEBHOOK_SECRET (same secret as send-email).
// Body: { submitterId: uuid }
// Side effect: fans out emails by invoking the send-email edge function with the
// 'verification_submitted' template. CORS-less / internal-only.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

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

  const expectedSecret = Deno.env.get('EMAIL_WEBHOOK_SECRET');
  if (!expectedSecret) return json(500, { error: 'Server misconfigured' });
  const presentedSecret = req.headers.get('X-Internal-Secret') ?? '';
  if (!timingSafeEqual(presentedSecret, expectedSecret)) return json(403, { error: 'Forbidden' });

  let body: { submitterId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }
  const submitterId = typeof body.submitterId === 'string' ? body.submitterId : '';
  if (!submitterId) return json(400, { error: 'submitterId required' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) return json(500, { error: 'Server misconfigured' });

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Submitter profile + email
  const { data: profile } = await sb
    .from('profiles')
    .select('username, first_name, last_name')
    .eq('id', submitterId)
    .maybeSingle();
  const { data: userRes } = await sb.auth.admin.getUserById(submitterId);
  const userEmail = userRes?.user?.email ?? '';
  const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username || '—';

  const submittedAt = new Date().toISOString();
  const reviewUrl = `${Deno.env.get('PUBLIC_APP_URL') ?? ''}/admin/verifications`;

  // Fetch admin user_ids and resolve their emails via auth.admin.
  const { data: admins } = await sb.from('platform_admins').select('user_id');
  const adminIds = (admins ?? []).map((r: { user_id: string }) => r.user_id);
  const adminEmails: string[] = [];
  for (const id of adminIds) {
    const { data } = await sb.auth.admin.getUserById(id);
    const e = data?.user?.email;
    if (e) adminEmails.push(e);
  }
  if (adminEmails.length === 0) {
    return json(200, { ok: true, sent: 0, reason: 'no admins with email' });
  }

  // Fan-out via send-email function
  const sendUrl = `${supabaseUrl}/functions/v1/send-email`;
  let sent = 0;
  for (const to of adminEmails) {
    try {
      const resp = await fetch(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': expectedSecret },
        body: JSON.stringify({
          to,
          template: 'verification_submitted',
          vars: {
            userName,
            username: profile?.username ?? '',
            userEmail,
            submittedAt,
            reviewUrl,
          },
        }),
      });
      if (resp.ok) sent++;
    } catch (err) {
      console.error('[notify-verification-submitted] send failed', err);
    }
  }

  return json(200, { ok: true, sent });
});
