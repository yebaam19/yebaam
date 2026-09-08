import Link from 'next/link'
import type { Route } from 'next'
import { ArrowRight, ArrowUpRight, CloudSun, Megaphone, Newspaper, PenLine, Settings, Sparkles } from 'lucide-react'
import { NewsCard } from './NewsCard'
import { WeatherWidget } from './WeatherWidget'
import { newsCoverUrl } from '../server/news.server'
import type { NewsAd, NewsArticle, NewsModuleSettings, NewsScope, NewsSection } from '../types'

const scopes = [
  { value: 'local', label: 'Local' },
  { value: 'regional', label: 'Regional' },
  { value: 'national', label: 'Nacional' },
  { value: 'international', label: 'Internacional' },
] as const

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950'

function filterHref(basePath: string, section?: string, scope?: string): Route {
  const params = new URLSearchParams()
  if (section) params.set('seccion', section)
  if (scope) params.set('alcance', scope)
  const query = params.toString()
  return (query ? `${basePath}?${query}` : basePath) as Route
}

export function NewsPortal({
  articles,
  sections,
  settings,
  ads = [],
  recommended = [],
  activeSection,
  activeScope,
  availableScopes = scopes.map((scope) => scope.value),
  basePath = '/noticias',
  title = 'Lo que importa, cerca de ti.',
  description = 'Información local, regional, nacional e internacional de fuentes y profesionales autorizados.',
  manageHref,
}: {
  articles: NewsArticle[]
  sections: NewsSection[]
  settings: NewsModuleSettings
  ads?: NewsAd[]
  recommended?: NewsArticle[]
  activeSection?: string
  activeScope?: string
  availableScopes?: readonly NewsScope[]
  basePath?: string
  title?: string
  description?: string
  manageHref?: string
}) {
  const featured = articles.find((article) => article.isFeatured) ?? articles[0]
  const rest = featured ? articles.filter((article) => article.id !== featured.id) : []
  const hasFilters = Boolean(activeSection || activeScope)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav aria-label="Módulos del portal" className="hidden-scrollbar mb-7 flex gap-2 overflow-x-auto">
        <Link href={basePath as Route} aria-current="page" className={`inline-flex min-h-10 items-center gap-2 rounded-lg bg-neutral-900 px-3.5 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900 ${focusRing}`}>
          <Newspaper className="size-4" aria-hidden="true" /> Noticias
        </Link>
        {settings.weatherEnabled && <a href="#clima" className={`inline-flex min-h-10 items-center gap-2 rounded-lg bg-neutral-100 px-3.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 ${focusRing}`}><CloudSun className="size-4 text-secondary-600" aria-hidden="true" /> Clima</a>}
        <Link href="/promociones" className={`inline-flex min-h-10 items-center gap-2 rounded-lg bg-neutral-100 px-3.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 ${focusRing}`}>
          <Megaphone className="size-4 text-secondary-700" aria-hidden="true" /> Promociones
        </Link>
      </nav>

      <header className="border-b border-neutral-200 pb-7 dark:border-neutral-800 sm:pb-8">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <h1 className="max-w-2xl text-3xl font-black tracking-[-0.03em] text-balance text-neutral-950 dark:text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300 sm:text-base">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <span className="size-2 rounded-full bg-primary-600" aria-hidden="true" />
              <span><strong className="font-semibold text-neutral-900 dark:text-white">Actualización continua</strong><span className="hidden sm:inline"> · Fuentes verificadas</span></span>
            </div>
            <Link href="/noticias/crear" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 text-sm font-bold text-white transition-colors hover:bg-primary-800 ${focusRing}`}>
              <PenLine className="size-4" aria-hidden="true" /> Publicar
            </Link>
            {manageHref && <Link href={manageHref as Route} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 ${focusRing}`}><Settings className="size-4" aria-hidden="true" /> Administrar fuentes</Link>}
          </div>
        </div>
      </header>

      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav aria-label="Secciones de noticias" className="hidden-scrollbar flex gap-6 overflow-x-auto pt-1">
          <Link href={filterHref(basePath, undefined, activeScope)} aria-current={!activeSection ? 'page' : undefined} className={`border-b-2 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${!activeSection ? 'border-primary-600 text-primary-800 dark:text-primary-300' : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-white'} ${focusRing}`}>Portada</Link>
          {sections.map((section) => (
            <Link key={section.id} href={filterHref(basePath, section.slug, activeScope)} aria-current={activeSection === section.slug ? 'page' : undefined} className={`border-b-2 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${activeSection === section.slug ? 'border-primary-600 text-primary-800 dark:text-primary-300' : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-white'} ${focusRing}`}>
              {section.name}
            </Link>
          ))}
        </nav>
      </div>

      <nav aria-label="Alcance de las noticias" className="hidden-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
        <Link href={filterHref(basePath, activeSection)} aria-current={!activeScope ? 'page' : undefined} className={`min-h-9 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${!activeScope ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'} ${focusRing}`}>Todos los alcances</Link>
        {scopes.filter((scope) => availableScopes.includes(scope.value)).map((scope) => (
          <Link key={scope.value} href={filterHref(basePath, activeSection, scope.value)} aria-current={activeScope === scope.value ? 'page' : undefined} className={`min-h-9 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${activeScope === scope.value ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white'} ${focusRing}`}>
            {scope.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {featured ? (
            <>
              <section aria-label="Noticia destacada" className="mb-6"><NewsCard article={featured} priority /></section>
              {rest.length > 0 && <section aria-label="Últimas noticias" className="grid gap-5 md:grid-cols-2">{rest.map((article) => <NewsCard key={article.id} article={article} />)}</section>}
            </>
          ) : (
            <section className="border-y border-neutral-200 py-14 text-center dark:border-neutral-800 sm:py-16">
              <Newspaper className="mx-auto size-8 text-primary-600" strokeWidth={1.75} aria-hidden="true" />
              <h2 className="mt-4 text-xl font-bold tracking-[-0.02em] text-neutral-900 dark:text-white">{hasFilters ? 'No hay noticias con estos filtros' : 'La edición está lista para recibir historias'}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500 dark:text-neutral-400">{hasFilters ? 'Cambia la sección o el alcance para seguir explorando.' : 'Las primeras publicaciones aparecerán aquí cuando una fuente autorizada las publique.'}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {hasFilters && <Link href={basePath as Route} className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 ${focusRing}`}>Limpiar filtros</Link>}
                <Link href="/noticias/crear" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 text-sm font-bold text-white transition-colors hover:bg-primary-800 ${focusRing}`}>Publicar una noticia <ArrowRight className="size-4" aria-hidden="true" /></Link>
              </div>
            </section>
          )}
        </div>

        <aside aria-label="Información complementaria" className="space-y-5">
          {settings.weatherEnabled && <WeatherWidget />}
          {settings.trendsEnabled && articles.length > 0 && (
            <section className="border-t border-neutral-200 pt-5 dark:border-neutral-800">
              <div className="flex items-center gap-2"><Sparkles className="size-5 text-secondary-600" aria-hidden="true" /><h2 className="font-bold">En tendencia</h2></div>
              <ol className="mt-4 space-y-4 text-sm">
                {articles.slice(0, 4).map((article, index) => <li key={article.id} className="grid grid-cols-[1.5rem_1fr] gap-2"><span className="font-bold tabular-nums text-neutral-400">{index + 1}</span><Link href={`/noticias/${article.slug}` as Route} className={`line-clamp-2 font-medium leading-5 hover:text-primary-700 dark:hover:text-primary-400 ${focusRing}`}>{article.title}</Link></li>)}
              </ol>
            </section>
          )}
          {settings.adsEnabled && ads.length > 0 && (
            <section className="border-t border-neutral-200 pt-5 dark:border-neutral-800">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">Publicidad</p>
              {ads.map((ad) => {
                const image = newsCoverUrl(ad.imageCfImageId)
                return <a key={ad.id} href={ad.destinationUrl} target="_blank" rel="noreferrer" className={`mt-4 block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors hover:border-primary-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700 ${focusRing}`}>{image && <img src={image} alt="" className="aspect-[2/1] w-full object-cover" loading="lazy" />}<div className="p-3"><p className="text-xs text-neutral-500 dark:text-neutral-400">{ad.advertiserName} · #Publicidad</p><p className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold">{ad.headline}<ArrowUpRight className="size-4 shrink-0 text-primary-600" aria-hidden="true" /></p></div></a>
              })}
            </section>
          )}
        </aside>
      </div>

      {recommended.length > 0 && (
        <section className="mt-14 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-2xl font-black tracking-[-0.03em]">Recomendado para ti</h2><span className="text-xs text-neutral-500 dark:text-neutral-400">Según tus interacciones</span></div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{recommended.map((article) => <NewsCard key={`recommended-${article.id}`} article={article} />)}</div>
        </section>
      )}
    </div>
  )
}
