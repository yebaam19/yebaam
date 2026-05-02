import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getSpaceBoard, getSpaceOwnerBackLink, isSpaceAdmin } from '../../server/foro.server'
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

  const [roles, ownerBack] = await Promise.all([
    listSpaceRoles(board.space.id),
    getSpaceOwnerBackLink(board.space),
  ])

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      {ownerBack && (
        <Link
          href={ownerBack.href as Route}
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline dark:text-primary-400"
        >
          ← Volver a {ownerBack.label}
        </Link>
      )}
      <SpaceAdminShell space={board.space} categories={board.categories} roles={roles} />
    </div>
  )
}
