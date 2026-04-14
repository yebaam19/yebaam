// Internal-only Resend wrapper.
// Callable ONLY from trusted server-side contexts (DB triggers via pg_net, cron, other edge functions).
// Auth: X-Internal-Secret header must match EMAIL_WEBHOOK_SECRET env var (constant-time compared).
// Request body: { to: string, template: 'welcome' | 'friend_request', vars: Record<string,string> }
// The frontend must NEVER call this directly — there is no CORS, and browsers will fail closed.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const DEFAULT_FROM = 'Yeebaam <noreply@yeebaam.com>';
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const templates: Record<
  string,
  (v: Record<string, string>) => { subject: string; html: string }
> = {
  welcome: (v) => ({
    subject: `Welcome to Yeebaam${v.firstName ? ', ' + v.firstName : ''}!`,
    html: `<h1>Welcome${v.firstName ? ', ' + v.firstName : ''}!</h1><p>Your account is ready.</p>`,
  }),
  friend_request: (v) => ({
    subject: `${v.from ?? 'Someone'} sent you a friend request`,
    html: `<p><strong>${v.from ?? 'Someone'}</strong> wants to connect on Yeebaam.</p>`,
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
