/** Lightweight row used by the player queue. */
export interface PlayItem {
  trackId: string;
  title: string;
  artistName: string;
  albumSlug: string;
  artistSlug: string;
  coverCfId: string | null;
  audioUrl: string;
  durationSeconds: number;
}
