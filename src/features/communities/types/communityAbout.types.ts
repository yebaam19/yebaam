import type { LibraryAsset } from './communityLibrary.types';

export const ABOUT_TEXT_FIELDS = ['description', 'history', 'mission', 'vision', 'objectives', 'values'] as const;
export type AboutTextField = typeof ABOUT_TEXT_FIELDS[number];
export interface AboutLink { label: string; url: string }
export type CommunityAbout = Record<AboutTextField, string> & {
  id: string; community_id: string; founded_on: string | null; location: string;
  contact_email: string; contact_phone: string; website: string; social_links: AboutLink[];
  is_published: boolean; version: number;
};
export interface AboutMedia {
  id: string; community_id: string; about_id: string; asset_id: string; position: number; asset: LibraryAsset;
}
