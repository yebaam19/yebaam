import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import { canManageCommunityArticle, getCommunityArticlePage } from '@/features/communities/server/community-articles.server';
import { CommunityTopTabs } from '@/features/communities/components/CommunityTopTabs';
import { getCommunityProfileCapabilities } from '@/features/communities/server/community-plan.server';
import { getCommunityTopTabs } from '@/features/communities/server/community-top-tabs.server';
import { CommunityArticleCard } from '@/features/communities/components/CommunityArticleCard';
import { NewspaperIcon, PencilSquareIcon } from '@/components/icons/heroicons-shim';

export default async function CommunityArticlesPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; category?: string; cursor?: string }>;
}) {
  const [{ slug }, filters] = await Promise.all([params, searchParams]);
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();
  const [canManage, capabilities, topTabs] = await Promise.all([
    canManageCommunityArticle(community.id), getCommunityProfileCapabilities(community.id),
    getCommunityTopTabs(community.id),
  ]);
  const q = (filters.q ?? '').trim().slice(0, 100);
  const category = (filters.category ?? '').trim().slice(0, 120);
  let page;
  try {
    page = await getCommunityArticlePage(community.id, q, category, filters.cursor ?? null, canManage);
  } catch {
    if (filters.cursor) notFound();
    throw new Error('No se pudieron cargar los artículos.');
  }
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (category) query.set('category', category);
  if (page.nextCursor) query.set('cursor', page.nextCursor);
  const nextHref = `/feed/comunidades/${slug}/articulos?${query.toString()}`;
  return <div className="space-y-6">
    <CommunityTopTabs slug={slug} config={topTabs} canManage={capabilities.settings} />
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Artículos</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Ideas, historias y noticias de la comunidad.</p>
      </div>
      {canManage && <Link href={`/feed/comunidades/${slug}/articulos/nuevo` as Route}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-800 px-4 text-sm font-medium text-white hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800">
        <PencilSquareIcon className="size-4" /> Nuevo artículo
      </Link>}
    </header>
    <form method="get" className="flex flex-wrap gap-2">
      <label className="min-w-48 flex-1 text-sm font-medium text-neutral-900 dark:text-white">Buscar
        <input name="q" type="search" maxLength={100} defaultValue={q} placeholder="Título, resumen o contenido"
          className="mt-1 min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900" />
      </label>
      <label className="min-w-40 flex-1 text-sm font-medium text-neutral-900 dark:text-white">Categoría
        <input name="category" maxLength={120} defaultValue={category} placeholder="Todas"
          className="mt-1 min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900" />
      </label>
      <button type="submit" className="mt-6 min-h-11 rounded-lg border border-primary-800 px-4 text-sm font-medium text-primary-800 hover:bg-primary-50 focus-visible:outline-2 dark:border-primary-300 dark:text-primary-300 dark:hover:bg-primary-950">Aplicar</button>
    </form>
    {page.items.length > 0 ? <>
      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @[520px]:grid-cols-2 @[860px]:grid-cols-3">
          {page.items.map((article) => <CommunityArticleCard key={article.id} communitySlug={slug} article={article} />)}
        </div>
      </div>
      {page.nextCursor && <Link href={nextHref as Route}
        className="inline-flex min-h-11 items-center rounded-lg border border-primary-800 px-4 text-sm font-medium text-primary-800 hover:bg-primary-50 focus-visible:outline-2 dark:border-primary-300 dark:text-primary-300">
        Ver más artículos
      </Link>}
    </> : <div className="rounded-xl bg-neutral-50 p-8 text-center dark:bg-neutral-900">
      <NewspaperIcon className="mx-auto size-9 text-primary-800 dark:text-primary-300" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-semibold">{q || category ? 'No hay resultados' : 'Todavía no hay artículos'}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        {q || category ? 'Prueba con otra búsqueda o categoría.' : canManage ? 'Escribe el primer artículo o guárdalo como borrador.' : 'Los artículos aparecerán aquí cuando la comunidad los publique.'}
      </p>
    </div>}
  </div>;
}
