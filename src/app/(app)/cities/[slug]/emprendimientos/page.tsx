import { Suspense } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PlusIcon } from '@/components/icons/heroicons-shim';
import { EmprendimientoList } from '@/features/cities/components/emprendimientos/list/EmprendimientoList';
import { EmprendimientosToolbar } from '@/features/cities/components/emprendimientos/list/EmprendimientosToolbar';
import { MyPendingBanner } from '@/features/cities/components/emprendimientos/list/MyPendingBanner';
import {
  EMPRENDIMIENTO_CATEGORIES,
  listApprovedEmprendimientos,
  getMyEmprendimientosForCity,
  type EmprendimientoCategory,
} from '@/features/cities/server/emprendimientos.server';
import { getCityBySlug } from '@/features/cities/server/city.server';
import { getServerClient } from '@/utils/supabase/server';

const CATEGORY_SET = new Set<string>(EMPRENDIMIENTO_CATEGORIES);

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipo?: string; q?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  const t = await getTranslations('cities.emprendimientos.metadata');
  const cityName = city?.name ?? slug;
  return {
    title: t('title', { city: cityName }),
    description: t('description', { city: cityName }),
  };
}

/**
 * `/cities/[slug]/emprendimientos` — public listing of APPROVED
 * emprendimientos. Mirrors the classifieds page: the URL is the source of
 * truth for `tipo` and `q`; the toolbar island writes them via
 * `router.replace()`; the list streams inside a keyed Suspense boundary.
 */
export default async function EmprendimientosPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tipo: tipoRaw, q } = await searchParams;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const t = await getTranslations('cities.emprendimientos');
  const category = tipoRaw && CATEGORY_SET.has(tipoRaw)
    ? (tipoRaw as EmprendimientoCategory)
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
          href={`/cities/${slug}/emprendimientos/new` as Route}
          className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          {t('header.newCta')}
        </Link>
      </div>

      <Suspense fallback={null}>
        <MyPendingBannerAsync cityId={city.id} citySlug={slug} />
      </Suspense>

      <EmprendimientosToolbar />

      <Suspense fallback={<ListSkeleton />} key={`${category ?? 'all'}-${q ?? ''}`}>
        <EmprendimientoListAsync
          cityId={city.id}
          citySlug={slug}
          cityName={city.name}
          category={category}
          q={q}
        />
      </Suspense>
    </div>
  );
}

async function MyPendingBannerAsync({ cityId, citySlug }: { cityId: string; citySlug: string }) {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  const mine = await getMyEmprendimientosForCity(cityId, data.user.id);
  return <MyPendingBanner citySlug={citySlug} mine={mine} />;
}

async function EmprendimientoListAsync({
  cityId,
  citySlug,
  cityName,
  category,
  q,
}: {
  cityId: string;
  citySlug: string;
  cityName: string;
  category?: EmprendimientoCategory;
  q?: string;
}) {
  const items = await listApprovedEmprendimientos(cityId, {
    category,
    q,
    limit: 30,
    offset: 0,
  });
  return (
    <EmprendimientoList
      citySlug={citySlug}
      cityName={cityName}
      items={items}
      q={q}
      isFiltered={Boolean(category || (q && q.trim()))}
    />
  );
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
