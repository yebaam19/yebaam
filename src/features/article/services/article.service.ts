/**
 * Article Feature - Service
 *
 * Provides business logic and data operations for articles
 * Following Clean Architecture principles
 */

import { MOCK_ARTICLES, MOCK_ARTICLE_CONTEXTS, MOCK_AUTHORS, MOCK_COMMENTS } from '../data'
import {
  Article,
  ArticleBasic,
  ArticleComment,
  ArticleContext,
  ArticleListParams,
  ArticleListResponse,
  ArticleVisibility,
  CreateArticleData,
  CreateArticleResult,
  DeleteArticleResult,
  ToggleBookmarkResult,
  ToggleLikeResult,
} from '../interfaces'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const calculateReadTime = (content: string): number => {
  const textContent = content.replace(/<[^>]*>/g, '')
  const wordCount = textContent.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

const generateId = (): string => {
  return `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Simulate network delay
const delay = (ms: number = 500): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

// ============================================================================
// ARTICLE SERVICE CLASS
// ============================================================================

class ArticleService {
  // Store for runtime modifications (simulating database)
  private articles: Article[] = [...MOCK_ARTICLES]
  private comments: ArticleComment[] = [...MOCK_COMMENTS]
  private userLikes: Set<string> = new Set() // Format: "userId-articleId"
  private userBookmarks: Set<string> = new Set()

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  async getArticleById(id: string): Promise<{ success: boolean; article?: Article; error?: string }> {
    await delay(300)
    const article = this.articles.find((a) => a.id === id) || null

    if (!article) {
      return { success: false, error: 'Artículo no encontrado' }
    }

    return { success: true, article }
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    await delay(300)
    return this.articles.find((a) => a.slug === slug) || null
  }

  async getArticles(params: ArticleListParams = {}): Promise<ArticleListResponse> {
    await delay(400)

    const { page = 1, limit = 10, authorId, contextType, contextId, tags, search } = params

    let filtered = [...this.articles]

    // Filter by author
    if (authorId) {
      filtered = filtered.filter((a) => a.authorId === authorId)
    }

    // Filter by context
    if (contextType) {
      filtered = filtered.filter((a) => a.contextType === contextType)
    }
    if (contextId) {
      filtered = filtered.filter((a) => a.contextId === contextId)
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      filtered = filtered.filter((a) => tags.some((tag) => a.tags.includes(tag)))
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          a.summary?.toLowerCase().includes(searchLower) ||
          a.content.toLowerCase().includes(searchLower)
      )
    }

    // Sort by publishedAt (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt).getTime()
      const dateB = new Date(b.publishedAt || b.createdAt).getTime()
      return dateB - dateA
    })

    // Pagination
    const totalCount = filtered.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedArticles = filtered.slice(startIndex, endIndex)

    const articleBasics: ArticleBasic[] = paginatedArticles.map((a) => ({
      id: a.id,
      title: a.title,
      subtitle: a.subtitle,
      headerImageUrl: a.headerImageUrl,
      summary: a.summary,
      slug: a.slug,
      readTime: a.readTime,
      tags: a.tags,
      createdAt: a.createdAt,
      publishedAt: a.publishedAt,
      author: a.author,
      _count: a._count,
    }))

    return {
      articles: articleBasics,
      totalCount,
      hasMore: endIndex < totalCount,
      page,
      limit,
    }
  }

  async getArticlesByAuthor(authorId: string): Promise<ArticleBasic[]> {
    await delay(300)
    return this.articles
      .filter((a) => a.authorId === authorId)
      .map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: a.subtitle,
        headerImageUrl: a.headerImageUrl,
        summary: a.summary,
        slug: a.slug,
        readTime: a.readTime,
        tags: a.tags,
        createdAt: a.createdAt,
        publishedAt: a.publishedAt,
        author: a.author,
        _count: a._count,
      }))
  }

  async getCommentsByArticle(articleId: string): Promise<ArticleComment[]> {
    await delay(300)
    return this.comments.filter((c) => c.articleId === articleId)
  }

  async getAvailableContexts(userId: string): Promise<ArticleContext[]> {
    await delay(200)
    // In a real implementation, this would fetch user's blogs, clubs, etc.
    return MOCK_ARTICLE_CONTEXTS
  }

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  async createArticle(data: CreateArticleData, userId: string): Promise<CreateArticleResult> {
    await delay(800)

    try {
      // Validate required fields
      if (!data.title?.trim()) {
        return { success: false, error: 'El título es requerido' }
      }
      if (!data.content?.trim() || data.content === '<p></p>') {
        return { success: false, error: 'El contenido es requerido' }
      }

      // Find author
      const author = MOCK_AUTHORS.find((a) => a.id === userId) || MOCK_AUTHORS[0]

      // Generate slug
      let slug = generateSlug(data.title)
      let counter = 1
      while (this.articles.some((a) => a.slug === slug)) {
        slug = `${generateSlug(data.title)}-${counter}`
        counter++
      }

      // Calculate read time
      const readTime = calculateReadTime(data.content)

      // Create new article
      const newArticle: Article = {
        id: generateId(),
        title: data.title.trim(),
        subtitle: data.subtitle?.trim() || null,
        headerImageUrl: data.coverImageUrl || null,
        content: data.content,
        summary: data.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
        authorId: userId,
        contextType: data.contextType,
        contextId: data.contextId || null,
        visibility: data.visibility || ArticleVisibility.PUBLIC,
        slug,
        readTime,
        tags: data.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
        author,
        media: (data.attachments || []).map((att, index) => ({
          id: `media-${Date.now()}-${index}`,
          articleId: '',
          type: att.type,
          url: att.url,
          caption: att.caption || null,
          order: index,
          createdAt: new Date(),
        })),
        likes: [],
        bookmarks: [],
        _count: { likes: 0, comments: 0, views: 0 },
      }

      // Update media articleId
      newArticle.media = newArticle.media.map((m) => ({
        ...m,
        articleId: newArticle.id,
      }))

      this.articles.unshift(newArticle)

      return {
        success: true,
        article: {
          id: newArticle.id,
          title: newArticle.title,
          slug: newArticle.slug,
          url: `/feed/article/${newArticle.id}`,
        },
      }
    } catch (error) {
      console.error('Error creating article:', error)
      return {
        success: false,
        error: 'Error al crear el artículo. Inténtalo de nuevo.',
      }
    }
  }

  // updateArticle vive en `actions/articles.actions.ts` (updateArticleAction):
  // persiste de verdad en Supabase. El mock que existía aquí fue eliminado.

  async deleteArticle(articleId: string, userId: string): Promise<DeleteArticleResult> {
    await delay(400)

    try {
      const articleIndex = this.articles.findIndex((a) => a.id === articleId)
      if (articleIndex === -1) {
        return { success: false, error: 'Artículo no encontrado' }
      }

      const article = this.articles[articleIndex]
      if (article.authorId !== userId) {
        return { success: false, error: 'No tienes permisos para eliminar este artículo' }
      }

      this.articles.splice(articleIndex, 1)
      this.comments = this.comments.filter((c) => c.articleId !== articleId)

      return { success: true }
    } catch (error) {
      console.error('Error deleting article:', error)
      return { success: false, error: 'Error al eliminar el artículo' }
    }
  }

  // --------------------------------------------------------------------------
  // INTERACTION OPERATIONS
  // --------------------------------------------------------------------------

  async toggleLike(articleId: string, userId: string): Promise<ToggleLikeResult> {
    await delay(200)

    try {
      const article = this.articles.find((a) => a.id === articleId)
      if (!article) {
        return { success: false, isLiked: false, likeCount: 0, error: 'Artículo no encontrado' }
      }

      const likeKey = `${userId}-${articleId}`
      const isCurrentlyLiked = this.userLikes.has(likeKey)

      if (isCurrentlyLiked) {
        this.userLikes.delete(likeKey)
        article._count.likes = Math.max(0, article._count.likes - 1)
      } else {
        this.userLikes.add(likeKey)
        article._count.likes += 1
      }

      return {
        success: true,
        isLiked: !isCurrentlyLiked,
        likeCount: article._count.likes,
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      return { success: false, isLiked: false, likeCount: 0, error: 'Error al actualizar el like' }
    }
  }

  async toggleBookmark(articleId: string, userId: string): Promise<ToggleBookmarkResult> {
    await delay(200)

    try {
      const article = this.articles.find((a) => a.id === articleId)
      if (!article) {
        return { success: false, isBookmarked: false, error: 'Artículo no encontrado' }
      }

      const bookmarkKey = `${userId}-${articleId}`
      const isCurrentlyBookmarked = this.userBookmarks.has(bookmarkKey)

      if (isCurrentlyBookmarked) {
        this.userBookmarks.delete(bookmarkKey)
      } else {
        this.userBookmarks.add(bookmarkKey)
      }

      return {
        success: true,
        isBookmarked: !isCurrentlyBookmarked,
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      return { success: false, isBookmarked: false, error: 'Error al actualizar el bookmark' }
    }
  }

  async recordView(articleId: string, userId?: string): Promise<{ success: boolean }> {
    await delay(100)

    try {
      const article = this.articles.find((a) => a.id === articleId)
      if (article && article.authorId !== userId) {
        article._count.views += 1
      }
      return { success: true }
    } catch (error) {
      console.error('Error recording view:', error)
      return { success: false }
    }
  }

  // --------------------------------------------------------------------------
  // COMMENT OPERATIONS
  // --------------------------------------------------------------------------

  async addComment(
    articleId: string,
    userId: string,
    content: string,
    parentId?: string
  ): Promise<{ success: boolean; comment?: ArticleComment; error?: string }> {
    await delay(300)

    try {
      const article = this.articles.find((a) => a.id === articleId)
      if (!article) {
        return { success: false, error: 'Artículo no encontrado' }
      }

      const author = MOCK_AUTHORS.find((a) => a.id === userId) || MOCK_AUTHORS[0]

      const newComment: ArticleComment = {
        id: `comment-${Date.now()}`,
        content,
        userId,
        articleId,
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: author,
        _count: { likes: 0, replies: 0 },
      }

      this.comments.push(newComment)
      article._count.comments += 1

      return { success: true, comment: newComment }
    } catch (error) {
      console.error('Error adding comment:', error)
      return { success: false, error: 'Error al agregar el comentario' }
    }
  }

  // --------------------------------------------------------------------------
  // CHECK STATUS
  // --------------------------------------------------------------------------

  isLikedByUser(articleId: string, userId: string): boolean {
    return this.userLikes.has(`${userId}-${articleId}`)
  }

  isBookmarkedByUser(articleId: string, userId: string): boolean {
    return this.userBookmarks.has(`${userId}-${articleId}`)
  }
}

// Export singleton instance
export const articleService = new ArticleService()
