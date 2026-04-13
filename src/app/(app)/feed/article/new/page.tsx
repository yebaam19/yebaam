/**
 * New Article Page
 *
 * Page for creating a new article
 */

import { CreateArticleForm } from '@/features/article'
import { ArrowPathIcon } from '@/components/icons/heroicons-shim'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

// TODO: Replace with actual auth when available
const MOCK_USER = {
  id: 'user-1',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
  displayName: 'Juan García',
  username: 'juangarcia',
}

export default function NewArticlePage() {
  // TODO: Get actual user from session/auth
  const user = MOCK_USER

  if (!user) {
    redirect('/login')
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-white dark:bg-neutral-900">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      }
    >
      <CreateArticleForm user={user} />
    </Suspense>
  )
}

export const metadata = {
  title: 'Nuevo Artículo',
  description: 'Crea un nuevo artículo para compartir con la comunidad',
}
