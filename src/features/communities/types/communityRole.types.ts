export type CommunityRole = 'admin' | 'editor' | 'moderator';

export interface CommunityRoleGrant {
  userId: string;
  username: string;
  displayName: string;
  role: CommunityRole;
  canEditPlans: boolean;
  createdAt: string;
}

export interface CommunityRolePage {
  items: CommunityRoleGrant[];
  nextCursor: string | null;
}
