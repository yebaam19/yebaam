import type { MusicAudioUrl } from '../types/music/audio-url.types';

export const AUDIO_REFRESH_MARGIN_MS = 60_000;
const MAX_TTL_MS = 3_600_000;
const MAX_ENTRIES = 128;

export class AudioSessionChangedError extends Error {
  constructor() { super('Audio session changed'); }
}

type Entry = MusicAudioUrl & { wallDeadline: number; monotonicDeadline: number };

/** Memory only: never persisted, never shared with chat/admin or another tab. */
export class MusicAudioUrlCache {
  private viewerId: string | null | undefined;
  private generation = 0;
  private entries = new Map<string, Entry>();
  private pending = new Map<string, Promise<MusicAudioUrl>>();

  constructor(
    private readonly sign: (trackId: string) => Promise<MusicAudioUrl>,
    private readonly wallNow = () => Date.now(),
    private readonly monotonicNow = () => performance.now(),
  ) {}

  reset(viewerId?: string | null) {
    this.generation += 1;
    this.viewerId = viewerId;
    this.entries.clear();
    this.pending.clear();
  }

  invalidate(trackId: string) { this.entries.delete(trackId); }

  remaining(trackId: string): number {
    const entry = this.entries.get(trackId);
    return entry ? Math.min(
      entry.wallDeadline - this.wallNow(),
      entry.monotonicDeadline - this.monotonicNow(),
    ) : 0;
  }

  async get(trackId: string): Promise<MusicAudioUrl> {
    if (this.viewerId === undefined) throw new AudioSessionChangedError();
    const cached = this.entries.get(trackId);
    if (cached && this.remaining(trackId) > AUDIO_REFRESH_MARGIN_MS) return cached;
    this.entries.delete(trackId);
    const inflight = this.pending.get(trackId);
    if (inflight) return inflight;
    const generation = this.generation;
    const wallStart = this.wallNow();
    const monotonicStart = this.monotonicNow();
    const request = this.sign(trackId).then((result) => {
      if (generation !== this.generation || result.viewerId !== this.viewerId) {
        throw new AudioSessionChangedError();
      }
      const ttl = result.expiresAt - result.serverTime;
      // The server is authoritative; translate lifetime to local clocks to avoid
      // assuming a user's wall clock agrees with the signing server.
      if (!Number.isFinite(ttl) || ttl <= AUDIO_REFRESH_MARGIN_MS || ttl > MAX_TTL_MS ||
          !Number.isFinite(result.serverTime) || !result.url.startsWith('https://')) {
        throw new Error('Invalid audio URL response');
      }
      const entry: Entry = {
        ...result,
        wallDeadline: wallStart + ttl,
        monotonicDeadline: monotonicStart + ttl,
      };
      if (Math.min(entry.wallDeadline - this.wallNow(),
        entry.monotonicDeadline - this.monotonicNow()) <= AUDIO_REFRESH_MARGIN_MS) {
        throw new Error('Audio URL expired while loading');
      }
      for (const key of this.entries.keys()) {
        if (this.remaining(key) <= AUDIO_REFRESH_MARGIN_MS) this.entries.delete(key);
      }
      if (this.entries.size >= MAX_ENTRIES) this.entries.delete(this.entries.keys().next().value!);
      this.entries.set(trackId, entry);
      return result;
    }).finally(() => {
      // A previous session's late request must not remove this session's flight.
      if (this.pending.get(trackId) === request) this.pending.delete(trackId);
    });
    this.pending.set(trackId, request);
    return request;
  }
}
