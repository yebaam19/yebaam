'use client';

import { useTranslations } from 'next-intl';
import { PageContentResultCard } from './PageContentResultCard';
import { PageResultCard } from './PageResultCard';
import { UserResultCard } from './UserResultCard';
import type {
  AggregatedSearchResults,
  SearchResultType,
} from '../interfaces/search.interfaces';

interface SearchResultsListProps {
  results: AggregatedSearchResults;
  activeFilter: SearchResultType;
}

/**
 * Lista de resultados agrupada por facet (personas, páginas, publicaciones,
 * artículos, eventos, audiciones). Con el filtro "all" cada grupo lleva su
 * encabezado (reutiliza las etiquetas de search.filters); con un filtro
 * concreto se pinta sólo ese grupo, sin encabezado redundante.
 */
export function SearchResultsList({ results, activeFilter }: SearchResultsListProps) {
  const t = useTranslations('search.filters');
  const showAll = activeFilter === 'all';
  const show = (facet: SearchResultType) => showAll || activeFilter === facet;

  const section = (facet: SearchResultType, children: React.ReactNode) => (
    <section>
      {showAll && (
        <h2 className="px-1 pb-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
          {t(facet)}
        </h2>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  );

  return (
    <div className="space-y-6">
      {show('users') &&
        results.users.length > 0 &&
        section(
          'users',
          results.users.map((user) => <UserResultCard key={user.id} user={user} />)
        )}

      {show('pages') &&
        results.pages.length > 0 &&
        section(
          'pages',
          results.pages.map((page) => <PageResultCard key={page.id} page={page} />)
        )}

      {show('posts') &&
        results.posts.length > 0 &&
        section(
          'posts',
          results.posts.map((post) => (
            <PageContentResultCard key={post.id} kind="post" item={post} />
          ))
        )}

      {show('articles') &&
        results.articles.length > 0 &&
        section(
          'articles',
          results.articles.map((article) => (
            <PageContentResultCard key={article.id} kind="article" item={article} />
          ))
        )}

      {show('events') &&
        results.events.length > 0 &&
        section(
          'events',
          results.events.map((event) => (
            <PageContentResultCard key={event.id} kind="event" item={event} />
          ))
        )}

      {show('auditions') &&
        results.auditions.length > 0 &&
        section(
          'auditions',
          results.auditions.map((audition) => (
            <PageContentResultCard key={audition.id} kind="audition" item={audition} />
          ))
        )}
    </div>
  );
}
