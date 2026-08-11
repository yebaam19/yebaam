import { CELESTIAL_ALPHABET, glyphForChar, type CelestialGlyph } from './glyphs';

/**
 * Renders one celestial letterform. Stroke-only, inherits `currentColor`,
 * sized by the parent via className (e.g. `h-10 w-10`).
 */
export function CelestialGlyphMark({
  glyph,
  className,
  style,
}: {
  glyph: CelestialGlyph;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true" focusable="false">
      {glyph.paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={6} strokeLinecap="round" />
      ))}
      {glyph.rings.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={6} fill="none" stroke="currentColor" strokeWidth={3.5} />
      ))}
    </svg>
  );
}

interface CelestialTextProps {
  text: string;
  /** Wrapper classes — color and gap live here. */
  className?: string;
  /** Per-glyph size, default `h-9 w-9`. */
  glyphClassName?: string;
  /**
   * When set, glyphs fade in one after another as if being inscribed.
   * Value = delay step in ms between consecutive glyphs.
   */
  inscribeStepMs?: number;
  /**
   * Accessible description. The visible content is intentionally an
   * undecoded script, so screen readers get the same riddle, not a spoiler.
   */
  label?: string;
}

/**
 * A phrase set in the angelic alphabet. Characters without a glyph
 * (digits, punctuation) are skipped; spaces become word gaps.
 */
export function CelestialText({
  text,
  className,
  glyphClassName = 'h-9 w-9',
  inscribeStepMs,
  label,
}: CelestialTextProps) {
  const words = text.split(/\s+/).filter(Boolean);
  let glyphIndex = 0;

  return (
    <span
      className={className ?? 'inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-3'}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {words.map((word, w) => (
        <span key={w} className="inline-flex items-center" aria-hidden="true">
          {Array.from(word).map((char, c) => {
            const glyph = glyphForChar(char);
            if (!glyph) return null;
            const delay = inscribeStepMs != null ? glyphIndex * inscribeStepMs : undefined;
            glyphIndex += 1;
            return (
              <CelestialGlyphMark
                key={c}
                glyph={glyph}
                className={
                  inscribeStepMs != null
                    ? `${glyphClassName} motion-safe:animate-umbral-inscribe`
                    : glyphClassName
                }
                style={delay != null ? { animationDelay: `${delay}ms` } : undefined}
              />
            );
          })}
        </span>
      ))}
    </span>
  );
}

/**
 * The full 22-letter alphabet with its Latin transliterations — the cipher
 * key that makes every phrase on the page decodable. Rendered faint: it is
 * a reward for whoever scrolls, not a headline.
 */
export function CelestialAlphabetLegend({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ul className="grid grid-cols-6 gap-x-2 gap-y-5 sm:grid-cols-8 md:grid-cols-11">
        {CELESTIAL_ALPHABET.map((glyph) => (
          <li key={glyph.name} className="flex flex-col items-center gap-1.5">
            <CelestialGlyphMark glyph={glyph} className="h-7 w-7" />
            <span className="text-[9px] tracking-[0.25em] text-neutral-600 uppercase">{glyph.latin}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
