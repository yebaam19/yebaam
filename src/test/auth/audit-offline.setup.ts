import { vi } from 'vitest';

// No real credentials or network are available to the audit suites.
for (const key of Object.keys(process.env)) {
  if (/SUPABASE|CLOUDFLARE|RESEND|TURNSTILE|SENTRY/.test(key)) delete process.env[key];
}
vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network disabled for local audit'); }));
