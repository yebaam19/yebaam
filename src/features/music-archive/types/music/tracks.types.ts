import type {
  MusicCopyrightStatus,
  MusicCreditRole,
  MusicSourceMedia,
  MusicTrackFormat,
  MusicTrackSide,
} from './common.types';

export interface MusicTrackRow {
  id: string;
  album_id: string;
  position: number;
  side: MusicTrackSide | null;
  title: string;
  duration_seconds: number | null;
  r2_key: string;
  format: MusicTrackFormat;
  bitrate_kbps: number | null;
  source_media: MusicSourceMedia | null;
  copyright_status: MusicCopyrightStatus;
  contributor_attestation: boolean;
  contributed_by: string | null;
  restored_by_note: string | null;
  play_count: number;
  created_at: string;
}

export interface MusicTrackCreditRow {
  id: string;
  track_id: string;
  role: MusicCreditRole;
  credit_name: string;
  artist_id: string | null;
}

export interface CreateTrackDto {
  albumId: string;
  position: number;
  side?: MusicTrackSide;
  title: string;
  durationSeconds?: number;
  r2Key: string;
  format: MusicTrackFormat;
  bitrateKbps?: number;
  sourceMedia?: MusicSourceMedia;
  copyrightStatus: MusicCopyrightStatus;
  contributorAttestation: boolean;
  restoredByNote?: string;
}

export interface AddTrackCreditDto {
  trackId: string;
  role: MusicCreditRole;
  creditName: string;
  artistId?: string;
}

/** One row passed to `createTracksBatchAction`. The album_id and contributor
 *  attestation come from the action's other parameter and the auth gate. */
export interface CreateTrackBatchItem {
  position: number;
  side?: MusicTrackSide | null;
  title: string;
  durationSeconds?: number | null;
  r2Key: string;
  format: MusicTrackFormat;
  sourceMedia?: MusicSourceMedia | null;
  copyrightStatus: MusicCopyrightStatus;
  restoredByNote?: string | null;
}

/** Editable fields on an existing track (admin CRUD). */
export interface UpdateTrackDto {
  title?: string;
  position?: number;
  side?: MusicTrackSide | null;
  durationSeconds?: number | null;
  sourceMedia?: MusicSourceMedia | null;
  copyrightStatus?: MusicCopyrightStatus;
  restoredByNote?: string | null;
}
