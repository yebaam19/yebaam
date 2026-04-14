import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getSpaceBoard, isSpaceAdmin } from '../server/foro.server'
import SpaceBoard from '@/features/foro/components/SpaceBoard'

interface PageProps {
  params: Promise<{ spaceSlug: string }>
}

export default async function SpacePage({ params }: PageProps) {
  const { spaceSlug } = await params
  const result = await getSpaceBoard(spaceSlug)
  if (!result) notFound()
  const { space, categories } = result
  const userIsAdmin = await isSpaceAdmin(space.id)

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {space.name}
            </h1>
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-400">
              {space.ownerType}
            </span>
            {space.visibility !== 'public' && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:bg-amber-900/40 dark:text-amber-300">
                {space.visibility === 'private' ? 'Privado' : 'Secreto'}
              </span>
            )}
          </div>
          {space.description && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {space.description}
            </p>
          )}
        </div>
        {userIsAdmin && (
          <Link
            href={`/foro/${space.slug}/admin` as Route}
            className="inline-flex items-center rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Administrar
          </Link>
        )}
      </header>

      <SpaceBoard space={space} categories={categories} />
    </div>
  )
}
