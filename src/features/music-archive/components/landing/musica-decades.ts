/**
 * Decade buckets surfaced as filter pills on the `/musica` landing page.
 * Shared between the page (which validates the `decade` search param against
 * this set) and `MusicFilterRail` (which renders the pills), so both agree on
 * the single source of truth for valid decades.
 */
export const LANDING_DECADES: ReadonlyArray<{ start: number; label: string }> = [
  { start: 1900, label: '1900s' },
  { start: 1910, label: '1910s' },
  { start: 1920, label: '1920s' },
  { start: 1930, label: '1930s' },
  { start: 1940, label: '1940s' },
  { start: 1950, label: '1950s' },
  { start: 1960, label: '1960s' },
  { start: 1970, label: '1970s' },
];
