export interface Group {
  id: string;
  name: string;
  description: string;
  coverImageUrl?: string;
  memberCount: number;
  postCount: number;
  privacy: 'public' | 'private';
  category: string;
  isMember: boolean;
  isAdmin?: boolean;
  creatorId?: string;
  creatorName?: string;
  creatorUsername?: string;
  creatorAvatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type GroupTab = 'my-groups' | 'discover';
