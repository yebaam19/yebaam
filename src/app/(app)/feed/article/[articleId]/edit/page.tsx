/**
 * Edit Article Page
 *
 * Server component: loads the authenticated user and the real article from
 * Supabase. Only the author may edit — anyone else is bounced to the detail.
 */

import { EditArticleForm } from '@/features/article'
import { getArticleById } from '@/features/article/server/articles.server'
import { resolveImageRef } from '@/lib/media/urls'
import { getServerClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'

interface EditArticlePageProps {
  params: Promise<{
    articleId: string
  }>
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { articleId } = await params

  const [article, client] = await Promise.all([getArticleById(articleId), getServerClient()])

  const {
    data: { user },
  } = await client.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/feed/article/${articleId}/edit`)
  }

  if (!article) {
    notFound()
  }

  if (article.authorId !== user.id) {
    redirect(`/feed/article/${articleId}`)
  }

  const { data: profile } = await client
    .from('profiles')
    .select('id, username, display_name, first_name, last_name, avatar_url, avatar_cloudflare_id')
    .eq('id', user.id)
    .maybeSingle()

  const displayName =
    profile?.display_name ??
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ??
    profile?.username ??
    'Usuario'

  const formUser = {
    id: user.id,
    avatarUrl: resolveImageRef(profile?.avatar_url ?? profile?.avatar_cloudflare_id, 'avatar'),
    displayName: displayName || 'Usuario',
    username: profile?.username ?? '',
  }

  return <EditArticleForm article={article} user={formUser} />
}

export const metadata = {
  title: 'Editar Artículo',
  description: 'Edita tu artículo',
}
