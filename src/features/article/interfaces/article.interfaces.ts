/**
 * Article Feature - Interfaces
 *
 * Defines all types and interfaces for the article feature
 * following DDD principles
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ArticleContextType {
  USER_PROFILE = 'USER_PROFILE',
  BLOG = 'BLOG',
  CLUB = 'CLUB',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum ArticleVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  LIMITED = 'LIMITED',
  CONTEXT_INHERITED = 'CONTEXT_INHERITED',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface ArticleAuthor {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  isVerified?: boolean
}

export interface ArticleMedia {
  id: string
  articleId: string
  type: MediaType
  url: string
  caption: string | null
  order: number
  createdAt: Date | string
}

export interface ArticleLike {
  userId: string
  articleId: string
  createdAt: Date | string
}

export interface ArticleBookmark {
  id: string
  userId: string
  articleId: string
  createdAt: Date | string
}

export interface ArticleComment {
  id: string
  content: string
  userId: string
  articleId: string
  parentId: string | null
  createdAt: Date | string
  updatedAt: Date | string
  user: ArticleAuthor
  replies?: ArticleComment[]
  _count?: {
    likes: number
    replies: number
  }
}

export interface ArticleViewRecord {
  id: string
  articleId: string
  userId: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date | string
}

// ============================================================================
// MAIN ARTICLE INTERFACES
// ============================================================================

export interface Article {
  id: string
  title: string
  subtitle: string | null
  headerImageUrl: string | null
  content: string
  summary: string | null
  authorId: string
  contextType: ArticleContextType
  contextId: string | null
  visibility: ArticleVisibility
  slug: string
  readTime: number | null
  tags: string[]
  createdAt: Date | string
  updatedAt: Date | string
  publishedAt: Date | string | null
  author: ArticleAuthor
  media: ArticleMedia[]
  likes: ArticleLike[]
  bookmarks: ArticleBookmark[]
  _count: {
    likes: number
    comments: number
    views: number
  }
}

export interface ArticleBasic {
  id: string
  title: string
  subtitle: string | null
  headerImageUrl: string | null
  summary: string | null
  slug: string
  readTime: number | null
  tags: string[]
  createdAt: Date | string
  publishedAt: Date | string | null
  author: ArticleAuthor
  _count: {
    likes: number
    comments: number
    views: number
  }
}

// ============================================================================
// CONTEXT INTERFACES
// ============================================================================

export interface ArticleContext {
  type: ArticleContextType
  id: string | null
  name: string
  description: string
  imageUrl?: string | null
  disabled?: boolean
  disabledReason?: string
}

// ============================================================================
// CREATE/UPDATE DATA INTERFACES
// ============================================================================

export interface CreateArticleData {
  title: string
  subtitle?: string
  content: string
  headerImageUrl?: string
  coverImageUrl?: string
  attachments?: Array<{
    type: MediaType
    url: string
    caption?: string | null
  }>
  authorId: string
  contextType: ArticleContextType
  contextId?: string | null
  visibility?: ArticleVisibility
  tags?: string[]
}

export interface UpdateArticleData {
  title?: string
  subtitle?: string
  content?: string
  headerImageUrl?: string
  coverImageUrl?: string
  attachments?: Array<{
    type: MediaType
    url: string
    caption?: string | null
  }>
  visibility?: ArticleVisibility
  tags?: string[]
}

// ============================================================================
// RESULT INTERFACES
// ============================================================================

export interface CreateArticleResult {
  success: boolean
  article?: {
    id: string
    title: string
    slug: string
    url: string
  }
  error?: string
}

export interface UpdateArticleResult {
  success: boolean
  article?: {
    id: string
    title: string
    slug: string
    url: string
    media: ArticleMedia[]
  }
  error?: string
}

export interface ToggleLikeResult {
  success: boolean
  isLiked: boolean
  likeCount: number
  error?: string
}

export interface ToggleBookmarkResult {
  success: boolean
  isBookmarked: boolean
  error?: string
}

export interface DeleteArticleResult {
  success: boolean
  error?: string
}

// ============================================================================
// PAGINATION INTERFACES
// ============================================================================

export interface ArticleListParams {
  page?: number
  limit?: number
  authorId?: string
  contextType?: ArticleContextType
  contextId?: string
  tags?: string[]
  search?: string
}

export interface ArticleListResponse {
  articles: ArticleBasic[]
  totalCount: number
  hasMore: boolean
  page: number
  limit: number
}

// Alias for hooks compatibility
export interface ArticlesResult {
  articles: ArticleBasic[]
  pagination: {
    totalCount: number
    hasMore: boolean
    page: number
    limit: number
  }
}

export interface ArticleFilters {
  authorId?: string
  contextType?: ArticleContextType
  contextId?: string
  tags?: string[]
  search?: string
}

export interface GetArticleResult {
  success: boolean
  article?: Article
  error?: string
}
