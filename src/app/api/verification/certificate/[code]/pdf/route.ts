import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import puppeteer, { type Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { getServerClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CERT_W = 1100;
const CERT_H = 800;

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

  // Build the absolute URL to the cert page in print mode using the incoming
  // request's host so it works in any environment without env vars.
  const h = await headers();
  const proto =
    h.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const certUrl = `${proto}://${host}/verification/certificate/${encodeURIComponent(code)}?print=1`;

  let browser: Browser | undefined;
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

    // Forward the caller's auth cookie so getServerClient on the cert page sees the
    // same session (RLS-friendly) when rendering for the export.
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      await page.setExtraHTTPHeaders({ cookie: cookieHeader });
    }

    await page.goto(certUrl, { waitUntil: 'networkidle0', timeout: 30_000 });

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
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}
