import { Suspense } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PlusIcon } from '@/components/icons/heroicons-shim';
import { ClassifiedList } from '@/features/cities/components/classifieds/ClassifiedList';
import { ClassifiedsToolbar } from '@/features/cities/components/classifieds/ClassifiedsToolbar';
import {
  listOpenClassifieds,
  type ClassifiedKind,
} from '@/features/cities/server/classifieds.server';
import { getCityBySlug } from '@/features/cities/server/city.server';

const ALLOWED_KINDS = new Set<ClassifiedKind>(['offer', 'want', 'trade', 'free']);

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ kind?: string; q?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  const t = await getTranslations('cities.classifieds.metadata');
  const cityName = city?.name ?? slug;
  return {
    title: t('title', { city: cityName }),
    description: t('description', { city: cityName }),
  };
}

/**
 * `/cities/[slug]/classifieds` — RSC listing.
 *
 * The URL is the source of truth for `kind` and `q`. The toolbar (client
 * island) reads them via `useSearchParams()` and writes via
 * `router.replace()` — there is no `useState` mirror that would drift on
 * back navigation. The list is wrapped in a Suspense boundary keyed on
 * those params so chip/search changes stream a fresh slice without
 * re-rendering the cover or the toolbar.
 */
export default async function ClassifiedsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { kind: kindRaw, q } = await searchParams;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const t = await getTranslations('cities.classifieds');
  const kind = kindRaw && ALLOWED_KINDS.has(kindRaw as ClassifiedKind)
    ? (kindRaw as ClassifiedKind)
    : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">
            {t('header.title')}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('header.subtitle', { city: city.name })}
          </p>
        </div>
        <Link
          href={`/cities/${slug}/classifieds/new` as Route}
          className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          {t('header.newCta')}
        </Link>
      </div>

      <ClassifiedsToolbar />

      <Suspense
        fallback={<ListSkeleton />}
        key={`${kind ?? 'all'}-${q ?? ''}`}
      >
        <ClassifiedListAsync
          cityId={city.id}
          citySlug={slug}
          kind={kind}
          q={q}
        />
      </Suspense>
    </div>
  );
}

async function ClassifiedListAsync({
  cityId,
  citySlug,
  kind,
  q,
}: {
  cityId: string;
  citySlug: string;
  kind?: ClassifiedKind;
  q?: string;
}) {
  const items = await listOpenClassifieds(cityId, {
    kind,
    q,
    limit: 30,
    offset: 0,
  });
  return <ClassifiedList citySlug={citySlug} items={items} />;
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/3] animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-700"
        />
      ))}
    </div>
  );
}
