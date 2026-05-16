'use client'

/**
 * ArticleView Component
 *
 * Main component for displaying a full article with all its content,
 * actions, and comments section
 */

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useArticleActions } from '../hooks/useArticleActions'
import { Article } from '../interfaces'
import { ArticleComments } from './ArticleComments'
import { ArticleHeader } from './ArticleHeader'
import { ArticleMobileActions } from './ArticleMobileActions'
import { ArticleSidebarActions } from './ArticleSidebarActions'

interface ArticleViewProps {
  article: Article
  currentUserId?: string | null
}

export function ArticleView({ article, currentUserId }: ArticleViewProps) {
  const t = useTranslations('article.view')
  const [mounted, setMounted] = useState(false)

  const {
    isLiked,
    likeCount,
    isBookmarked,
    isLoading,
    isDeleting,
    handleLike,
    handleBookmark,
    handleShare,
    recordView,
    handleDelete,
  } = useArticleActions(article, currentUserId)

  const isAuthor = currentUserId === article.authorId

  const handleScrollToComments = () => {
    const commentsSection = document.getElementById('comments-section')
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    setMounted(true)
    recordView()
  }, [recordView])

  return (
    <div className="min-h-screen w-full bg-white dark:bg-neutral-900">
      <ArticleHeader
        article={article}
        likeCount={likeCount}
        isAuthor={isAuthor}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      {article.headerImageUrl && (
        <div className="relative h-[300px] w-full overflow-hidden md:h-[400px]">
          <Image
            src={article.headerImageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
            priority
          />
        </div>
      )}

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex gap-8">
          {mounted && (
            <ArticleSidebarActions
              isLiked={isLiked}
              likeCount={likeCount}
              commentCount={article._count.comments}
              isBookmarked={isBookmarked}
              isLoading={isLoading}
              isLoggedIn={!!currentUserId}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onShare={handleShare}
              onComment={handleScrollToComments}
            />
          )}

          <div className="min-w-0 flex-1 overflow-hidden">
            <article
              className="article-content prose prose-lg w-full max-w-none prose-headings:text-neutral-900 dark:prose-headings:text-white prose-h1:my-6 prose-h1:text-3xl prose-h1:font-bold prose-h2:my-4 prose-h2:text-2xl prose-h2:font-bold prose-h3:my-3 prose-h3:text-xl prose-h3:font-semibold prose-p:leading-relaxed prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:text-primary-700 hover:prose-a:underline dark:prose-a:text-primary-400 prose-blockquote:rounded-r-md prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:bg-neutral-100 prose-blockquote:py-2 prose-blockquote:pl-4 prose-blockquote:text-neutral-700 prose-blockquote:italic dark:prose-blockquote:bg-neutral-800 dark:prose-blockquote:text-neutral-300 prose-strong:font-semibold prose-strong:text-neutral-900 dark:prose-strong:text-white prose-code:rounded prose-code:bg-neutral-100 prose-code:px-2 prose-code:py-1 prose-code:text-sm prose-code:font-medium prose-code:text-primary-600 dark:prose-code:bg-neutral-800 dark:prose-code:text-primary-400 prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:border prose-pre:border-neutral-200 prose-pre:bg-neutral-100 prose-pre:p-4 prose-pre:text-neutral-800 dark:prose-pre:border-neutral-700 dark:prose-pre:bg-neutral-800 dark:prose-pre:text-neutral-200 prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-li:my-1 prose-li:pl-1 prose-img:my-4 prose-img:h-auto prose-img:max-w-full prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {mounted && (
              <ArticleMobileActions
                isLiked={isLiked}
                likeCount={likeCount}
                commentCount={article._count.comments}
                isBookmarked={isBookmarked}
                isLoading={isLoading}
                isLoggedIn={!!currentUserId}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onShare={handleShare}
                onComment={handleScrollToComments}
              />
            )}

            {currentUserId && (
              <div id="comments-section" className="mt-5 border-t border-neutral-200 px-4 pt-4 dark:border-neutral-700">
                <h3 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-white">{t('commentsTitle')}</h3>
                <ArticleComments articleId={article.id} currentUserId={currentUserId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
