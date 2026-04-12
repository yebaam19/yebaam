/**
 * Article Detail Page
 *
 * Server component that fetches and displays a single article
 */

import { ArticleView, articleService } from '@/features/article'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

// TODO: Replace with actual auth when available
const MOCK_CURRENT_USER_ID = 'user-1'

interface ArticlePageProps {
  params: Promise<{
    articleId: string
  }>
}

async function ArticleContent({ articleId }: { articleId: string }) {
  const result = await articleService.getArticleById(articleId)

  if (!result.success || !result.article) {
    notFound()
  }

  return <ArticleView article={result.article} currentUserId={MOCK_CURRENT_USER_ID} />
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { articleId } = await params

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-white dark:bg-neutral-900">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      }
    >
      <ArticleContent articleId={articleId} />
    </Suspense>
  )
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { articleId } = await params
  const result = await articleService.getArticleById(articleId)

  if (!result.success || !result.article) {
    return {
      title: 'Artículo no encontrado',
    }
  }

  return {
    title: result.article.title,
    description: result.article.subtitle || result.article.summary,
    openGraph: {
      title: result.article.title,
      description: result.article.subtitle || result.article.summary,
      images: result.article.headerImageUrl ? [result.article.headerImageUrl] : [],
    },
  }
}
