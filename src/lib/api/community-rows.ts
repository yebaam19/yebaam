import type { CommunityCategory, CommunityPrivacy, CommunityRole } from '@/features/communities/types/community.types';

export type CommunityRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: CommunityCategory;
  privacy: CommunityPrivacy;
  cover_image: string | null;
  profile_image: string | null;
  location: string | null;
  website: string | null;
  tags: string[] | null;
  rules: unknown;
  allow_member_posts: boolean;
  require_approval: boolean;
  is_certified: boolean;
  member_count: number;
  post_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
};

export type CommunityMemberRow = {
  community_id: string;
  user_id: string;
  role: CommunityRole;
  status: 'active' | 'pending' | 'banned';
  joined_at: string;
};

export type CommunityPostRow = {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  media: unknown;
  created_at: string;
  updated_at: string;
};

export type ProfileLite = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export type CommunityViewerCtx = {
  userId: string | null;
  ownerProfile: ProfileLite | null;
  ownerMembership: CommunityMemberRow | null;
  myMembership: CommunityMemberRow | null;
};

