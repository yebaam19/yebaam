import type { MusicTrackSide } from '../../../types/music.types';

/** Per-track row in the multi-track list. Audio file is held until submit
 *  (we don't pre-upload to R2 to allow re-ordering and per-row delete without
 *  orphaning R2 objects). Shared by the admin and the public upload forms. */
export interface TrackDraft {
  id: string;
  file: File;
  title: string;
  side: MusicTrackSide | '';
  durationSeconds: number | null;
  uploadProgress: number | null;
  r2Key: string | null;
  /** Track number pinned at first submit. Kept across retries so reordering or
   *  removing rows between attempts can't collide with positions already
   *  inserted in the DB. */
  position?: number;
  /** Set once the track row is inserted, so a retry after a partial batch
   *  failure doesn't insert this track a second time. */
  published?: boolean;
}
