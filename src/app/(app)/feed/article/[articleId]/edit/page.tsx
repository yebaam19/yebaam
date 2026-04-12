/**
 * Edit Article Page
 *
 * Page for editing an existing article (only accessible by the author)
 */

import { EditArticleForm, articleService } from '@/features/article'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { notFound, redirect } from 'next/navigation'
import { Suspense } from 'react'

// TODO: Replace with actual auth when available
const MOCK_USER = {
  id: 'user-1',
  avatarUrl: 'https://i.pravatar.cc/150?u=user1',
  displayName: 'Usuario Demo',
  username: 'demo_user',
}

interface EditArticlePageProps {
  params: Promise<{
    articleId: string
  }>
}

async function EditArticleContent({ articleId }: { articleId: string }) {
  const user = MOCK_USER

  if (!user) {
    redirect('/login')
  }

  const result = await articleService.getArticleById(articleId)

  if (!result.success || !result.article) {
    notFound()
  }

  // Check if current user is the author
  if (result.article.authorId !== user.id) {
    redirect(`/feed/article/${articleId}`)
  }

  return <EditArticleForm article={result.article} user={user} />
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { articleId } = await params

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-white dark:bg-neutral-900">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      }
    >
      <EditArticleContent articleId={articleId} />
    </Suspense>
  )
}

export const metadata = {
  title: 'Editar Artículo',
  description: 'Edita tu artículo',
}
