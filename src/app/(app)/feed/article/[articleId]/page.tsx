/**
 * Article Detail Page
 *
 * Server component that fetches and displays a single article from Supabase.
 */

import { ArticleView } from '@/features/article'
import { getArticleById } from '@/features/article/server/articles.server'
import { getServerClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'

interface ArticlePageProps {
  params: Promise<{
    articleId: string
  }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { articleId } = await params

  const [article, client] = await Promise.all([getArticleById(articleId), getServerClient()])

  if (!article) {
    notFound()
  }

  const {
    data: { user },
  } = await client.auth.getUser()

  return <ArticleView article={article} currentUserId={user?.id ?? null} />
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { articleId } = await params
  const article = await getArticleById(articleId)

  if (!article) {
    return {
      title: 'Artículo no encontrado',
    }
  }

  return {
    title: article.title,
    description: article.subtitle || article.summary,
    openGraph: {
      title: article.title,
      description: article.subtitle || article.summary,
      images: article.headerImageUrl ? [article.headerImageUrl] : [],
    },
  }
}
