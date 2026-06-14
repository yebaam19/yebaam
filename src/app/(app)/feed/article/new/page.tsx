/**
 * New Article Page
 *
 * Server component that loads the authenticated user and renders the create
 * form. Anonymous visitors are redirected to the login page.
 */

import { CreateArticleForm } from '@/features/article'
import { getServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const CF_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null | undefined): string | null {
  if (!id || !CF_ACCOUNT_HASH) return null
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${id}/public`
}

export default async function NewArticlePage() {
  const client = await getServerClient()
  const {
    data: { user },
  } = await client.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/feed/article/new')
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
    avatarUrl: profile?.avatar_url ?? cfImageUrl(profile?.avatar_cloudflare_id) ?? null,
    displayName: displayName || 'Usuario',
    username: profile?.username ?? '',
  }

  return <CreateArticleForm user={formUser} />
}

export const metadata = {
  title: 'Nuevo Artículo',
  description: 'Crea un nuevo artículo para compartir con la comunidad',
}
