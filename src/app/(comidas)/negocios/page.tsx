import type { Metadata } from 'next'
import { listBusinesses } from '@/features/comidas/server/business.server'
import { getFollowedBusinesses } from '@/features/comidas/server/engagement.server'
import { getAuthUser } from '@/features/auth/actions/auth.actions'
import { NegociosList } from '@/features/comidas/components/public/NegociosList'

export const metadata: Metadata = {
  title: 'Negocios | Yebaam',
  description: 'Descubre y sigue negocios de tu comunidad. Recibe sus novedades en tu feed.',
}

export default async function NegociosPage() {
  const [{ data: businesses, count }, user] = await Promise.all([
    listBusinesses({ limit: 100 }),
    getAuthUser().catch(() => null),
  ])

  const followedIds = user
    ? new Set((await getFollowedBusinesses(user.id)).map((b) => b.id))
    : new Set<string>()

  return (
    <NegociosList
      businesses={businesses}
      totalCount={count ?? businesses.length}
      isAuthenticated={!!user}
      followedIds={followedIds}
    />
  )
}
