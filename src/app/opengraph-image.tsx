import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

// Default Open Graph / social-share card for every route (login, signup, feed…)
// unless a page exports its own `openGraph.images`. Renders the YEBAAM logo so a
// shared link always previews with the brand mark instead of whatever image the
// scraper happens to find on the page. Source logo: public/yebaam.png.
export const alt = 'Yebaam';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  // Read from public/ — Vercel ships the public dir to the function, so this path
  // resolves both locally and in production. The logo is 1536×1024 (3:2).
  const logo = await readFile(join(process.cwd(), 'public', 'yebaam.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
          background: 'linear-gradient(135deg, #064e3b 0%, #0a7f53 55%, #10b981 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            borderRadius: 36,
            padding: '56px 80px',
            boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={468} height={312} alt="Yebaam" />
        </div>
        <div
          style={{
            marginTop: 40,
            color: '#ffffff',
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          Conecta con el mundo
        </div>
      </div>
    ),
    { ...size },
  );
}
