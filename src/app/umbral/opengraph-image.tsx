import { ImageResponse } from 'next/og';

import { glyphForChar } from '@/features/umbral/celestial/glyphs';
import { UMBRAL_HEADING, UMBRAL_META_DESCRIPTION } from '@/features/umbral/constants';

// The share card IS the stunt: a link pasted into WhatsApp previews as an
// unreadable angelic inscription on black. No logo, no explanation — the
// only Latin text is the advertencia.
export const alt = 'El Umbral';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GLYPH_SIZE = 96;
const WORD_GAP = 40;

export default async function OpengraphImage() {
  const words = UMBRAL_HEADING.split(/\s+/).filter(Boolean);

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
          gap: 64,
          background: '#050507',
          backgroundImage:
            'radial-gradient(ellipse 65% 50% at 50% 40%, rgba(34, 165, 76, 0.10), rgba(5, 5, 7, 0) 70%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: WORD_GAP }}>
          {words.map((word, w) => (
            <div key={w} style={{ display: 'flex', alignItems: 'center' }}>
              {Array.from(word).map((char, c) => {
                const glyph = glyphForChar(char);
                if (!glyph) return null;
                return (
                  <svg key={c} width={GLYPH_SIZE} height={GLYPH_SIZE} viewBox="0 0 100 100">
                    {glyph.paths.map((d, i) => (
                      <path
                        key={`p${i}`}
                        d={d}
                        fill="none"
                        stroke="#e7e5e4"
                        strokeWidth={6}
                        strokeLinecap="round"
                      />
                    ))}
                    {glyph.rings.map(([cx, cy], i) => (
                      <circle
                        key={`r${i}`}
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="none"
                        stroke="#e7e5e4"
                        strokeWidth={3.5}
                      />
                    ))}
                  </svg>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', color: '#57534e', fontSize: 34, fontStyle: 'italic' }}>
          {UMBRAL_META_DESCRIPTION}
        </div>
      </div>
    ),
    { ...size },
  );
}
