import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { type Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { getServerClient } from '@/utils/supabase/server';
import { checkRateLimit, clientIp } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CERT_W = 1100;
const CERT_H = 800;

/**
 * Each request forks a full Chromium and holds it for up to the navigation
 * timeout, so this route is expensive in a way ordinary handlers are not: a few
 * hundred concurrent requests exhaust the process (self-hosted) or the shared
 * function instance. Two bounds, because they fail differently — the rate limit
 * stops one caller looping, the semaphore stops many callers arriving at once.
 */
const PDF_RATE_LIMIT = { limit: 10, windowMs: 60 * 1000 };
const MAX_CONCURRENT_BROWSERS = 2;
let activeBrowsers = 0;

/**
 * The origin Chromium navigates to is a server-side constant, never derived
 * from request headers.
 *
 * `x-forwarded-proto` / `x-forwarded-host` are attacker-controlled on any
 * deployment whose edge does not overwrite them — which includes the
 * self-hosted `next start` mode this file explicitly supports. Interpolating
 * the host unencoded let a caller steer `page.goto()` at cloud
 * instance-metadata endpoints, internal-only services, or their own domain, and
 * the rendered response came back to them as a PDF: a full read SSRF.
 */
function certificateOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (configured) return configured;
  return process.env.NODE_ENV === 'production' ? 'https://yebaam.com' : 'http://localhost:3000';
}

interface RouteContext {
  params: Promise<{ code: string }>;
}

async function resolveExecutablePath(): Promise<string> {
  // On serverless (Vercel/Lambda) the @sparticuz/chromium package supplies a
  // runtime-compatible Chromium binary. Locally on dev (Windows/macOS) we use
  // a Chrome install on the host so devs don't need the serverless binary.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    return await chromium.executablePath();
  }

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // Common Chrome paths on the developer's host
  const candidates =
    process.platform === 'win32'
      ? [
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
          'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          ]
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];

  const fs = await import('node:fs/promises');
  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // keep going
    }
  }

  throw new Error(
    'No Chrome/Chromium binary found. Set PUPPETEER_EXECUTABLE_PATH to override.',
  );
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { code } = await ctx.params;

  const rate = checkRateLimit(`cert-pdf:${clientIp(req)}`, PDF_RATE_LIMIT);
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } },
    );
  }

  if (activeBrowsers >= MAX_CONCURRENT_BROWSERS) {
    return NextResponse.json(
      { error: 'Certificate export is busy, try again shortly' },
      { status: 503, headers: { 'Retry-After': '5' } },
    );
  }

  // Validate the cert exists & is verified before spinning up Chromium
  const sb = await getServerClient();
  const { data } = await sb
    .from('profiles')
    .select('unique_id_code, is_verified')
    .eq('unique_id_code', code)
    .maybeSingle();

  if (!data || !data.is_verified) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  const certUrl = `${certificateOrigin()}/verification/certificate/${encodeURIComponent(code)}?print=1`;

  let browser: Browser | undefined;
  activeBrowsers += 1;
  try {
    const executablePath = await resolveExecutablePath();
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION);

    browser = await puppeteer.launch({
      args: isServerless
        ? chromium.args
        : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath,
      headless: true,
      defaultViewport: { width: CERT_W, height: CERT_H, deviceScaleFactor: 2 },
    });

    const page = await browser.newPage();

    // No cookie forwarding. The certificate page is public — it is reachable
    // unauthenticated at /verification/certificate/<code>, which is the whole
    // point of a shareable certificate — so it needs no session, and
    // `setExtraHTTPHeaders({ cookie })` attached the caller's `sb-*` cookies to
    // *every* request the page made. Those cookies are not httpOnly, so pairing
    // that with a caller-chosen origin handed the session to whatever host was
    // named. If a session is ever genuinely required here, scope it with
    // `page.setCookie()` against the known-good origin instead.

    await page.goto(certUrl, { waitUntil: 'networkidle0', timeout: 15_000 });

    // Wait for fonts so signatures/serif text are crisp in the PDF
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });

    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="yebaam-certificate-${code}.pdf"`,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (err) {
    console.error('[certificate-pdf]', err);
    return NextResponse.json(
      { error: 'Failed to generate certificate PDF' },
      { status: 500 },
    );
  } finally {
    activeBrowsers -= 1;
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}
