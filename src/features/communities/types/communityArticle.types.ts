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
  publishedAt: string;
  author: CommunityArticleAuthor;
}

export interface CommunityArticle extends CommunityArticleSummary {
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunityArticleInput {
  communityId: string;
  title: string;
  subtitle?: string;
  content: string;
  cfImageId?: string;
  tags?: string[];
}

export interface UpdateCommunityArticleInput {
  articleId: string;
  title: string;
  subtitle?: string;
  content: string;
  /**
   * Cloudflare image id for the cover. `null` removes the existing cover;
   * `undefined` leaves it untouched.
   */
  cfImageId?: string | null;
  tags?: string[];
}
