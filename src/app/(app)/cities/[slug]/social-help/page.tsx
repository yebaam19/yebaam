import { Suspense } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PlusIcon } from '@/components/icons/heroicons-shim';
import { HelpList } from '@/features/cities/components/social-help/HelpList';
import { HelpToolbar } from '@/features/cities/components/social-help/HelpToolbar';
import {
  listOpenSocialHelp,
  type HelpKind,
} from '@/features/cities/server/social-help.server';
import { getCityBySlug } from '@/features/cities/server/city.server';

const ALLOWED_KINDS = new Set<HelpKind>(['offer', 'need']);

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ kind?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  const t = await getTranslations('cities.socialHelp.metadata');
  const cityName = city?.name ?? slug;
  return {
    title: t('title', { city: cityName }),
    description: t('description', { city: cityName }),
  };
}

export default async function SocialHelpPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { kind: kindRaw } = await searchParams;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const t = await getTranslations('cities.socialHelp');
  const kind = kindRaw && ALLOWED_KINDS.has(kindRaw as HelpKind)
    ? (kindRaw as HelpKind)
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
          href={`/cities/${slug}/social-help/new` as Route}
          className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4" />
          {t('header.newCta')}
        </Link>
      </div>

      <HelpToolbar />

      <Suspense fallback={<ListSkeleton />} key={kind ?? 'all'}>
        <HelpListAsync cityId={city.id} citySlug={slug} kind={kind} />
      </Suspense>
    </div>
  );
}

async function HelpListAsync({
  cityId,
  citySlug,
  kind,
}: {
  cityId: string;
  citySlug: string;
  kind?: HelpKind;
}) {
  const items = await listOpenSocialHelp(cityId, { kind, limit: 30, offset: 0 });
  return <HelpList citySlug={citySlug} items={items} />;
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
