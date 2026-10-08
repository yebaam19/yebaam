import type { AboutLink } from './communityAbout.types';
import type { LibraryAsset } from './communityLibrary.types';

export interface LeaderCategory {
  id: string; community_id: string; section_id: string; title: string;
  position: number; is_published: boolean; version: number;
}
export interface LeaderSummary {
  id: string; community_id: string; section_id: string; category_id: string | null;
  full_name: string; responsibility: string; position: number; is_published: boolean; version: number;
  portrait?: LeaderMedia | null;
}
export interface CommunityLeader extends LeaderSummary { biography: string; trajectory: string }
export interface LeaderContacts {
  id: string; community_id: string; email: string; phone: string; social_links: AboutLink[];
  profile_id: string | null; profile_username?: string | null; is_public: boolean; version: number;
}
export type LeaderMediaSlot = 'portrait' | 'cover' | 'video';
export interface LeaderMedia {
  id: string; community_id: string; leader_id: string; slot: LeaderMediaSlot;
  asset_id: string; version: number; asset: LibraryAsset | null;
}
