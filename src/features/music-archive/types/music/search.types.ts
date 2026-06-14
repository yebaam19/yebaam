/** Combined-search hit shape consumed by the autocomplete dropdown.
 *  Lives here (not in `server/music.server.ts`) so client components can
 *  type-import it without crossing the server-only boundary. */
export interface MusicSearchHit {
  type: 'artist' | 'album' | 'track';
  id: string;
  label: string;
  sublabel: string | null;
  href: string;
}
