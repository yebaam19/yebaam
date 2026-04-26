// Internal-only Resend wrapper.
// Callable ONLY from trusted server-side contexts (DB triggers via pg_net, cron, other edge functions).
// Auth: X-Internal-Secret header must match EMAIL_WEBHOOK_SECRET env var (constant-time compared).
// Request body: { to: string, template: 'welcome' | 'friend_request', vars: Record<string,string> }
// The frontend must NEVER call this directly — there is no CORS, and browsers will fail closed.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const DEFAULT_FROM = 'Yeebaam <noreply@yeebaam.com>';
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Escape any user-controlled string before interpolating into HTML email
// bodies. Without this, a user with a malicious display name (or any
// other field that flows from the DB into an email template) could inject
// arbitrary HTML / links into the recipient's mailbox.
function esc(s: string | undefined | null): string {
  if (s == null) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Strip any HTML and quote-bound characters from values that flow into the
// `subject` line. Email subjects should always be plain text.
function plain(s: string | undefined | null): string {
  if (s == null) return '';
  return String(s).replace(/[\r\n<>]+/g, ' ').slice(0, 200);
}

// Allow only http(s) links for the `reviewUrl` slot. Rejects javascript:, data:,
// and other schemes that would otherwise be rendered as a clickable link.
function safeUrl(s: string | undefined | null): string {
  if (!s) return '#';
  try {
    const u = new URL(s);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
  } catch {
    // fallthrough
  }
  return '#';
}

const templates: Record<
  string,
  (v: Record<string, string>) => { subject: string; html: string }
> = {
  welcome: (v) => ({
    subject: `Welcome to Yeebaam${v.firstName ? ', ' + plain(v.firstName) : ''}!`,
    html: `<h1>Welcome${v.firstName ? ', ' + esc(v.firstName) : ''}!</h1><p>Your account is ready.</p>`,
  }),
  friend_request: (v) => ({
    subject: `${plain(v.from) || 'Someone'} sent you a friend request`,
    html: `<p><strong>${esc(v.from) || 'Someone'}</strong> wants to connect on Yeebaam.</p>`,
  }),
  verification_submitted: (v) => ({
    subject: `[Yeebaam] Nueva solicitud de verificación: ${plain(v.userName) || 'usuario'}`,
    html: `<p>Hay una nueva solicitud de autenticación pendiente.</p>
<ul>
  <li><strong>Usuario:</strong> ${esc(v.userName) || '—'} (@${esc(v.username) || '—'})</li>
  <li><strong>Email:</strong> ${esc(v.userEmail) || '—'}</li>
  <li><strong>Enviada:</strong> ${esc(v.submittedAt) || '—'}</li>
</ul>
<p><a href="${esc(safeUrl(v.reviewUrl))}">Revisar en el panel de admin</a></p>`,
  }),
};

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
  if (!expectedSecret) {
    console.error('[send-email] EMAIL_WEBHOOK_SECRET not configured');
    return json(500, { error: 'Server misconfigured' });
  }

  const presentedSecret = req.headers.get('X-Internal-Secret') ?? '';
  if (!timingSafeEqual(presentedSecret, expectedSecret)) {
    return json(403, { error: 'Forbidden' });
  }

  let body: { to?: unknown; template?: unknown; vars?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const to = typeof body.to === 'string' ? body.to.trim() : '';
  const template = typeof body.template === 'string' ? body.template : '';
  const vars =
    body.vars && typeof body.vars === 'object' && !Array.isArray(body.vars)
      ? (body.vars as Record<string, string>)
      : {};

  if (!emailRx.test(to)) return json(400, { error: 'Invalid recipient' });
  if (!templates[template]) return json(400, { error: 'Invalid template' });

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.error('[send-email] RESEND_API_KEY not configured');
    return json(500, { error: 'Email send failed' });
  }

  const { subject, html } = templates[template](vars);

  let resp: Response;
  try {
    resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: DEFAULT_FROM, to: [to], subject, html }),
    });
  } catch (err) {
    console.error('[send-email] Resend fetch failed', err);
    return json(500, { error: 'Email send failed' });
  }

  const payload = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    console.error('[send-email] Resend returned', resp.status, payload);
    return json(500, { error: 'Email send failed' });
  }

  return json(200, { ok: true, id: (payload as { id?: string }).id ?? null });
});
