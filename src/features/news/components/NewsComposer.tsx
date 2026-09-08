import type { MyNewsSource } from '../server/news-author.server'
import type { NewsSection } from '../types'
import { NewsArticleForm } from './NewsArticleForm'
import { NewsSourceRegistration } from './NewsSourceRegistration'

interface NewsComposerProps {
  sections: NewsSection[]
  sources: MyNewsSource[]
  cities: Array<{ id: string; label: string }>
  eligible: boolean
  newsEnabled: boolean
  videosEnabled: boolean
}

export function NewsComposer({
  sections,
  sources,
  cities,
  eligible,
  newsEnabled,
  videosEnabled,
}: NewsComposerProps) {
  if (!newsEnabled) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-xl font-bold">Publicación temporalmente desactivada</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          Administración desactivó el módulo de noticias.
        </p>
      </section>
    )
  }

  if (!eligible) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h1 className="text-xl font-bold">Publicar noticias requiere un perfil profesional verificado</h1>
        <p className="mt-2 text-sm leading-6">
          La responsabilidad editorial está vinculada a una identidad profesional vigente y a una fuente autorizada.
        </p>
      </section>
    )
  }

  const approvedSources = sources.filter((source) => source.status === 'approved')
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black">Publicar noticia</h1>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
        Tu nombre, fuente autorizada y alcance aparecerán junto a la publicación.
      </p>
      {approvedSources.length ? (
        <NewsArticleForm
          sections={sections}
          sources={approvedSources}
          cities={cities}
          videosEnabled={videosEnabled}
        />
      ) : (
        <NewsSourceRegistration cities={cities} />
      )}
    </div>
  )
}
