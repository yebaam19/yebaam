import type { LibraryAsset } from './communityLibrary.types';

export interface CommunityShowcase {
  id: string;
  community_id: string;
  introduction: string;
  is_published: boolean;
  version: number;
  videos: ShowcaseVideo[];
}
export interface ShowcaseVideo {
  id: string;
  community_id: string;
  asset_id: string;
  position: number;
  /** Editors can remove unavailable references without exposing archived media. */
  asset: LibraryAsset | null;
}
