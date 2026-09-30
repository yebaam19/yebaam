/** Music playback capability. Keep only in memory; never persist the signed URL. */
export type MusicAudioUrl = {
  url: string;
  /** Epoch milliseconds derived from the exact R2 signing timestamp and TTL. */
  expiresAt: number;
  /** Server epoch milliseconds sampled after signing, for client clock skew. */
  serverTime: number;
  /** Verified caller scope; null represents the public, unauthenticated viewer. */
  viewerId: string | null;
};
