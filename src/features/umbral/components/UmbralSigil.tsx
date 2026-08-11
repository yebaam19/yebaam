import Link from 'next/link';
import { CelestialGlyphMark } from '../celestial/CelestialText';
import { glyphForChar } from '../celestial/glyphs';
import { UMBRAL_PATH } from '../constants';

/**
 * The discreet doorway (clave-1.pdf: "llamativa pero no tan visible"). A
 * single yod — traditionally the smallest letter, the point everything
 * starts from — breathing faintly in a corner of the login page. No label,
 * no tooltip: whoever notices it, follows it.
 */
export function UmbralSigil({ className }: { className?: string }) {
  const yod = glyphForChar('Y');
  if (!yod) return null;

  return (
    <Link
      href={UMBRAL_PATH}
      aria-label="El Umbral"
      className={`group inline-flex items-center justify-center p-2 ${className ?? ''}`}
    >
      <CelestialGlyphMark
        glyph={yod}
        className="animate-umbral-breathe h-7 w-7 text-white/60 transition-colors duration-700 group-hover:text-emerald-300"
      />
    </Link>
  );
}
