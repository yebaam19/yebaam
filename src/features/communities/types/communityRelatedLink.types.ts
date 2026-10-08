export interface CommunityRelatedLink {
  id: string;
  community_id: string;
  title: string;
  description: string;
  href: string;
  image_asset_id: string | null;
  image: { id: string; title: string; media_id: string } | null;
  position: number;
  is_published: boolean;
  version: number;
}

export interface RelatedLinkCursor { position: number; id: string }
export interface RelatedLinkPage {
  items: CommunityRelatedLink[];
  nextCursor: RelatedLinkCursor | null;
}
