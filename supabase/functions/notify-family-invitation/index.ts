// Notifies a user that they have been invited to a family.
// Auth: X-Internal-Secret must equal EMAIL_WEBHOOK_SECRET (timing-safe compare).
// Body: { invitationId: uuid }
// Side effects:
//   1. Loads the invitation (exits if not pending, with audit row).
//   2. Counts inviter sends in the last hour; >= RATE_LIMIT means audit + 429.
//   3. Inserts an in-app notification (best effort, ignored if table absent).
//   4. Sends an email via the send-email function with 'family_invitation' template.
//   5. Always inserts a row in family_invitation_audit recording the outcome.
// Internal-only (no CORS), invoked from the inviteToFamilyByUsername server action.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RATE_LIMIT_PER_HOUR = 20;

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
  | 'email_sent'
  | 'no_email_on_file'
  | 'rate_limited'
  | 'invitation_not_pending'
  | 'send_failed';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const expectedSecret = Deno.env.get('EMAIL_WEBHOOK_SECRET');
  if (!expectedSecret) return json(500, { error: 'Server misconfigured' });
  const presentedSecret = req.headers.get('X-Internal-Secret') ?? '';
  if (!timingSafeEqual(presentedSecret, expectedSecret)) return json(403, { error: 'Forbidden' });

  let body: { invitationId?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }
  const invitationId = typeof body.invitationId === 'string' ? body.invitationId : '';
  if (!invitationId) return json(400, { error: 'invitationId required' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) return json(500, { error: 'Server misconfigured' });

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const writeAudit = async (
    outcome: AuditOutcome,
    inviterCountLastHour: number | null,
    detail: string | null,
    invitation: { id: string; family_id: string; invited_by: string; invitee_id: string } | null,
  ) => {
    try {
      await sb.from('family_invitation_audit').insert({
        invitation_id: invitation?.id ?? null,
        family_id: invitation?.family_id ?? null,
        invited_by: invitation?.invited_by ?? '00000000-0000-0000-0000-000000000000',
        invitee_id: invitation?.invitee_id ?? '00000000-0000-0000-0000-000000000000',
        outcome,
        inviter_count_last_hour: inviterCountLastHour,
        detail,
      });
    } catch (err) {
      console.error('[notify-family-invitation] audit insert failed:', err);
    }
  };

  const { data: invitation, error: invErr } = await sb
    .from('family_invitations')
    .select('id, family_id, invitee_id, invited_by, status')
    .eq('id', invitationId)
    .maybeSingle();

  if (invErr) return json(500, { error: 'DB error', detail: invErr.message });
  if (!invitation) return json(404, { error: 'Invitation not found' });
  if (invitation.status !== 'pending') {
    await writeAudit('invitation_not_pending', null, `status=${invitation.status}`, invitation);
    return json(200, { ok: true, skipped: true, reason: 'invitation not pending' });
  }

  // Rate limit: how many invitations has this inviter created in the last hour?
  const { data: rateData, error: rateErr } = await sb.rpc('count_recent_family_invites', {
    p_inviter_id: invitation.invited_by,
  });
  const inviterCountLastHour =
    typeof rateData === 'number' ? rateData : rateErr ? null : Number(rateData ?? 0);

  if (inviterCountLastHour !== null && inviterCountLastHour > RATE_LIMIT_PER_HOUR) {
    await writeAudit('rate_limited', inviterCountLastHour, `>${RATE_LIMIT_PER_HOUR}/h`, invitation);
    return json(429, {
      error: 'Inviter rate-limited',
      inviterCountLastHour,
      limit: RATE_LIMIT_PER_HOUR,
    });
  }

  const { data: family } = await sb
    .from('families')
    .select('id, slug, name')
    .eq('id', invitation.family_id)
    .maybeSingle();

  const { data: inviter } = await sb
    .from('profiles')
    .select('username, first_name, last_name')
    .eq('id', invitation.invited_by)
    .maybeSingle();

  const { data: invitee } = await sb
    .from('profiles')
    .select('username, first_name, last_name')
    .eq('id', invitation.invitee_id)
    .maybeSingle();

  const { data: inviteeAuth } = await sb.auth.admin.getUserById(invitation.invitee_id);
  const inviteeEmail = inviteeAuth?.user?.email ?? '';

  const inviterName =
    [inviter?.first_name, inviter?.last_name].filter(Boolean).join(' ') ||
    inviter?.username ||
    'Un familiar';
  const inviteeName =
    [invitee?.first_name, invitee?.last_name].filter(Boolean).join(' ') ||
    invitee?.username ||
    '';

  const acceptUrl = `${Deno.env.get('PUBLIC_APP_URL') ?? ''}/feed/familias/invitaciones`;

  // Best-effort in-app notification (table may not have a 'kind' column yet — ignore failure).
  try {
    await sb.from('notifications').insert({
      user_id: invitation.invitee_id,
      kind: 'family_invitation',
      payload: {
        invitation_id: invitation.id,
        family_id: invitation.family_id,
        family_slug: family?.slug ?? null,
        family_name: family?.name ?? null,
        invited_by: invitation.invited_by,
        inviter_name: inviterName,
      },
    });
  } catch (err) {
    console.warn('[notify-family-invitation] in-app notification skipped:', err);
  }

  if (!inviteeEmail) {
    await writeAudit('no_email_on_file', inviterCountLastHour, null, invitation);
    return json(200, { ok: true, emailSent: false, hasEmail: false });
  }

  let emailSent = false;
  let sendDetail: string | null = null;
  try {
    const sendUrl = `${supabaseUrl}/functions/v1/send-email`;
    const resp = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': expectedSecret },
      body: JSON.stringify({
        to: inviteeEmail,
        template: 'family_invitation',
        vars: {
          inviterName,
          inviteeName,
          familyName: family?.name ?? '',
          familySlug: family?.slug ?? '',
          acceptUrl,
        },
      }),
    });
    emailSent = resp.ok;
    if (!resp.ok) sendDetail = `send-email returned ${resp.status}`;
  } catch (err) {
    sendDetail = err instanceof Error ? err.message : String(err);
    console.error('[notify-family-invitation] email send failed:', err);
  }

  await writeAudit(
    emailSent ? 'email_sent' : 'send_failed',
    inviterCountLastHour,
    sendDetail,
    invitation,
  );

  return json(200, { ok: true, emailSent, hasEmail: true, inviterCountLastHour });
});
