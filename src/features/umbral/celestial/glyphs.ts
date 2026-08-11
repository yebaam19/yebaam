/**
 * Alfabeto angélico — escritura "celestial" (tradición de Agrippa, 1533).
 *
 * 22 letterforms drawn as thin strokes whose terminals end in small open
 * rings — the signature trait of the script. These are stylized originals
 * (not a copy of any font): each glyph is SVG path data on a 100×100 grid,
 * stroked with `currentColor` by <CelestialText>.
 *
 * The Latin mapping follows the classical Hebrew→Latin transliteration
 * tables (aleph→A, beth→B, … tau→TH), so a patient visitor can decode any
 * phrase on the page using the on-screen legend. That decodability is the
 * whole point of the stunt: the page is a riddle, not a lock.
 */

export interface CelestialGlyph {
  /** Hebrew-derived letter name; documentation only, never rendered. */
  name: string;
  /** Latin letters this glyph transliterates — the legend label. */
  latin: string;
  /** Stroke-only SVG path data, 100×100 viewBox. */
  paths: string[];
  /** Centers of the terminal rings ([x, y]). */
  rings: Array<[number, number]>;
}

/** In traditional order (aleph … tau) — the legend renders this sequence. */
export const CELESTIAL_ALPHABET: CelestialGlyph[] = [
  {
    name: 'aleph',
    latin: 'A',
    paths: ['M28 34 L50 64 L72 34', 'M50 64 L50 72'],
    rings: [[24, 29], [76, 29], [50, 78]],
  },
  {
    name: 'beth',
    latin: 'B',
    paths: ['M31 30 L62 30 A 11 11 0 0 1 73 41 L73 65'],
    rings: [[24, 30], [73, 72]],
  },
  {
    name: 'gimel',
    latin: 'G',
    paths: ['M43 29 L43 56', 'M43 56 L63 70', 'M43 56 L28 68'],
    rings: [[43, 23], [68, 74], [23, 72]],
  },
  {
    name: 'daleth',
    latin: 'D',
    paths: ['M31 30 L70 30', 'M64 30 L64 69'],
    rings: [[24, 30], [76, 30], [64, 75]],
  },
  {
    name: 'he',
    latin: 'E',
    paths: ['M31 30 L70 30 L70 68', 'M34 50 L34 68'],
    rings: [[24, 30], [70, 74], [34, 44]],
  },
  {
    name: 'vau',
    latin: 'U V W',
    paths: ['M46 30 A 13 13 0 0 1 58 42 L58 67'],
    rings: [[40, 28], [58, 73]],
  },
  {
    name: 'zayin',
    latin: 'Z',
    paths: ['M35 28 L65 28', 'M50 28 L50 68'],
    rings: [[29, 28], [71, 28], [50, 74]],
  },
  {
    name: 'cheth',
    latin: 'H',
    paths: ['M30 40 A 20 20 0 0 1 70 40', 'M30 40 L30 69', 'M70 40 L70 69'],
    rings: [[30, 75], [70, 75]],
  },
  {
    name: 'teth',
    latin: 'T',
    paths: ['M28 56 Q 38 26 50 50 Q 62 74 71 46'],
    rings: [[26, 62], [74, 40]],
  },
  {
    name: 'yod',
    latin: 'I J Y',
    paths: ['M45 34 A 12 12 0 0 1 58 45 L53 58'],
    rings: [[40, 31], [51, 64]],
  },
  {
    name: 'kaph',
    latin: 'C K',
    paths: ['M64 30 A 25 25 0 1 0 64 70'],
    rings: [[70, 27], [70, 73]],
  },
  {
    name: 'lamed',
    latin: 'L',
    paths: ['M63 23 L52 44 A 17 17 0 0 1 38 63'],
    rings: [[66, 17], [32, 66]],
  },
  {
    name: 'mem',
    latin: 'M',
    paths: ['M28 66 L28 46 A 22 22 0 0 1 72 46 L72 66', 'M50 48 L50 58'],
    rings: [[28, 72], [72, 72], [50, 64]],
  },
  {
    name: 'nun',
    latin: 'N',
    paths: ['M62 28 L62 58 A 13 13 0 0 1 49 71 L38 71'],
    rings: [[62, 22], [32, 71]],
  },
  {
    name: 'samekh',
    latin: 'S',
    paths: ['M36 34 A 24 24 0 1 0 62 31'],
    rings: [[31, 30], [67, 26]],
  },
  {
    name: 'ayin',
    latin: 'O',
    paths: ['M31 32 L48 51', 'M69 30 L52 51', 'M50 53 L50 71'],
    rings: [[27, 27], [73, 25], [50, 77]],
  },
  {
    name: 'pe',
    latin: 'F P',
    paths: ['M62 28 A 24 24 0 1 0 64 68'],
    rings: [[67, 25], [69, 71], [51, 49]],
  },
  {
    name: 'tzaddi',
    latin: 'X',
    paths: ['M31 30 L49 49', 'M67 28 L51 49', 'M50 51 L50 61 A 10 10 0 0 0 60 70'],
    rings: [[27, 25], [72, 24], [66, 70]],
  },
  {
    name: 'qoph',
    latin: 'Q',
    paths: ['M66 26 L66 74', 'M66 36 A 17 17 0 1 0 66 60'],
    rings: [[66, 20], [66, 80]],
  },
  {
    name: 'resh',
    latin: 'R',
    paths: ['M29 30 L58 30 A 14 14 0 0 1 72 44 L72 68'],
    rings: [[23, 30], [72, 74]],
  },
  {
    name: 'shin',
    latin: 'SH',
    paths: ['M29 32 L37 64 L50 46 L63 64 L71 32'],
    rings: [[28, 26], [72, 26], [50, 40]],
  },
  {
    name: 'tau',
    latin: 'TH',
    paths: ['M35 33 L65 71', 'M65 33 L35 71'],
    rings: [[32, 28], [68, 28]],
  },
];

const byName = Object.fromEntries(CELESTIAL_ALPHABET.map((g) => [g.name, g]));

/**
 * One glyph per Latin letter. Several Latin letters share a glyph, exactly as
 * in the historical transliteration charts (C/K → kaph, U/V/W → vau, …).
 */
const LATIN_TO_GLYPH: Record<string, CelestialGlyph> = {
  A: byName.aleph,
  B: byName.beth,
  C: byName.kaph,
  D: byName.daleth,
  E: byName.he,
  F: byName.pe,
  G: byName.gimel,
  H: byName.cheth,
  I: byName.yod,
  J: byName.yod,
  K: byName.kaph,
  L: byName.lamed,
  M: byName.mem,
  N: byName.nun,
  O: byName.ayin,
  P: byName.pe,
  Q: byName.qoph,
  R: byName.resh,
  S: byName.samekh,
  T: byName.teth,
  U: byName.vau,
  V: byName.vau,
  W: byName.vau,
  X: byName.tzaddi,
  Y: byName.yod,
  Z: byName.zayin,
};

/** Accents fold to their base letter (Ñ → N) so any Spanish clave renders. */
export function glyphForChar(char: string): CelestialGlyph | null {
  const base = char
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
  return LATIN_TO_GLYPH[base] ?? null;
}
