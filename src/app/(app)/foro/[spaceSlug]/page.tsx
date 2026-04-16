import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getSpaceBoard, isSpaceAdmin } from '../server/foro.server'
import SpaceBoard from '@/features/foro/components/SpaceBoard'
import ForoHeader from '@/features/foro/components/ForoHeader'
import { getOwnerMeta } from '@/features/foro/utils/owner'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'

interface PageProps {
  params: Promise<{ spaceSlug: string }>
}

export default async function SpacePage({ params }: PageProps) {
  const { spaceSlug } = await params
  const result = await getSpaceBoard(spaceSlug)
  if (!result) notFound()
  const { space, categories } = result
  const userIsAdmin = await isSpaceAdmin(space.id)
  const owner = getOwnerMeta(space.ownerType)

  const subtitleLine = (
    <span className="flex flex-wrap items-center gap-2">
      <Badge color={owner.badgeColor}>{owner.label}</Badge>
      {space.visibility !== 'public' && (
        <Badge color="amber">{space.visibility === 'private' ? 'Privado' : 'Secreto'}</Badge>
      )}
      {space.description && (
        <span className="text-neutral-600 dark:text-neutral-400">{space.description}</span>
      )}
    </span>
  )

  return (
    <div className="container mx-auto max-w-6xl space-y-5 px-4 py-4 sm:py-6">
      <ForoHeader
        title={space.name}
        crumbs={[{ href: '/foro', label: 'Foros' }]}
        subtitle={undefined}
        action={
          userIsAdmin ? (
            <Button href={`/foro/${space.slug}/admin` as Route} outline className="w-full sm:w-auto">
              Administrar
            </Button>
          ) : null
        }
      />
      <div className="flex flex-wrap items-center gap-2 px-1 text-sm">
        {subtitleLine}
      </div>

      <SpaceBoard space={space} categories={categories} />
    </div>
  )
}
