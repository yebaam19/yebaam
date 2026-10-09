export type CommunityPrimaryColor = 'green' | 'forest';
export type CommunitySecondaryColor = 'gold' | 'amber';

export type CommunityTheme = {
  id: string | null;
  community_id: string;
  primary_color: CommunityPrimaryColor;
  secondary_color: CommunitySecondaryColor;
  version: number;
};
