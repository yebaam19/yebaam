import Link from 'next/link'
import type { Route } from 'next'
import { listPublicSpaces } from './server/foro.server'

export const metadata = {
  title: 'Foros',
}

export default async function ForoDiscoveryPage() {
  const spaces = await listPublicSpaces()

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Foros</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Explora los foros de clubes, comunidades, páginas y blogs.
        </p>
      </header>

      {spaces.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
          Todavía no hay foros disponibles.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <li
              key={space.id}
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-400 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Link href={`/foro/${space.slug}` as Route} className="block">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {space.name}
                  </h2>
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-400">
                    {space.ownerType}
                  </span>
                </div>
                {space.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-neutral-500 dark:text-neutral-400">
                    {space.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
