export interface CommunityArticleAuthor {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
}

export interface CommunityArticleSummary {
  id: string;
  communityId: string;
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  coverImageUrl: string | null;
  readTime: number | null;
  tags: string[];
  publishedAt: string | null;
  isPublished: boolean;
  category: string;
  version: number;
  author: CommunityArticleAuthor;
}

export interface CommunityArticle extends CommunityArticleSummary {
  content: string;
  coverAssetId: string | null;
  attachmentIds: string[];
  embeddedAssetIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunityArticleInput {
  id: string;
  communityId: string;
  title: string;
  subtitle?: string;
  content: string;
  summary?: string;
  category?: string;
  coverAssetId?: string | null;
  attachmentIds?: string[];
  isPublished: boolean;
  tags?: string[];
}

export interface UpdateCommunityArticleInput {
  articleId: string;
  communityId: string;
  expectedVersion: number;
  title: string;
  subtitle?: string;
  content: string;
  summary?: string;
  category?: string;
  coverAssetId?: string | null;
  attachmentIds?: string[];
  keepLegacyCover?: boolean;
  isPublished: boolean;
  tags?: string[];
}
