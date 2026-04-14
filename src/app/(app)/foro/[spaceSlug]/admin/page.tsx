import { notFound } from 'next/navigation'
import { getSpaceBoard, isSpaceAdmin } from '../../server/foro.server'
import { listSpaceRoles } from '../../server/admin.server'
import SpaceAdminShell from '@/features/foro/components/admin/SpaceAdminShell'

interface PageProps {
  params: Promise<{ spaceSlug: string }>
}

export default async function SpaceAdminPage({ params }: PageProps) {
  const { spaceSlug } = await params
  const board = await getSpaceBoard(spaceSlug)
  if (!board) notFound()
  const allowed = await isSpaceAdmin(board.space.id)
  if (!allowed) notFound()

  const roles = await listSpaceRoles(board.space.id)

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <SpaceAdminShell space={board.space} categories={board.categories} roles={roles} />
    </div>
  )
}
