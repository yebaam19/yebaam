export interface CommunityMember {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isVerified?: boolean;
  followedAt?: Date;
}

export interface GetFollowersResponse {
  followers: CommunityMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
