import { DocumentTextIcon } from '@/components/icons/heroicons-shim'

/**
 * Feed de publicaciones (Post 1/2/3) del mockup. El módulo de posts aún no está
 * enlazado a servicios profesionales, así que por ahora son marcadores
 * ("Próximamente"). Mantener el conteo en 3 para reflejar el wireframe.
 */
export function PostsFeed() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <article
          key={n}
          className="flex h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-center dark:border-neutral-700 dark:bg-neutral-800"
        >
          <DocumentTextIcon className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
          <p className="mt-2 font-semibold text-neutral-700 dark:text-neutral-200">Post {n}</p>
          <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase">Próximamente</p>
        </article>
      ))}
    </div>
  )
}
