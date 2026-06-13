import type { MusicTrackSide } from '../../types/music.types';

/** Per-track row in the multi-track list. Audio file is held until submit
 *  (we don't pre-upload to R2 to allow re-ordering and per-row delete without
 *  orphaning R2 objects). */
export interface TrackDraft {
  id: string;
  file: File;
  title: string;
  side: MusicTrackSide | '';
  durationSeconds: number | null;
  uploadProgress: number | null;
  r2Key: string | null;
}
