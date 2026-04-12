'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchPageContent } from './SearchPageContent';

/**
 * Página de búsqueda principal
 * Route: /search
 * Query params: q (query), type (filter type)
 * 
 * @example
 * /search?q=react&type=posts
 */
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageWrapper />
    </Suspense>
  );
}

/**
 * Wrapper para acceder a searchParams
 */
function SearchPageWrapper() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'all') as any;

  return <SearchPageContent initialQuery={query} initialType={type} />;
}

/**
 * Skeleton de carga inicial
 */
function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="h-12 bg-gray-200 dark:bg-neutral-800 rounded-lg mb-6 animate-pulse" />
        <div className="h-10 bg-gray-200 dark:bg-neutral-800 rounded-lg mb-6 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
