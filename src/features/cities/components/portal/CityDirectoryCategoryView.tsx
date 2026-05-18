import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
} from '@/components/icons/heroicons-shim';
import type { CityBusinessListing } from '@/features/cities/server/city.server';

interface CityDirectoryCategoryViewProps {
  citySlug: string;
  cityName: string;
  categoryLabel: string;
  businesses: CityBusinessListing[];
}

/**
 * Phase 5 directory listing for one city + one business category.
 *
 * The seed data carries no logos/photos yet, so each card falls back to a
 * gradient + initial-letter chip rather than a blank image frame. When real
 * logos start flowing in (`logo_url` or `ad_image_url`), they take over
 * automatically.
 */
export async function CityDirectoryCategoryView({
  citySlug,
  cityName,
  categoryLabel,
  businesses,
}: CityDirectoryCategoryViewProps) {
  const t = await getTranslations('cities.directoryCategory');
  const headerT = await getTranslations('cities');

  return (
    <div className="space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
      >
        <Link
          href="/feed"
          className="inline-flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <HomeIcon className="h-4 w-4" />
          {t('breadcrumb.home')}
        </Link>
        <ChevronRightIcon className="h-4 w-4 opacity-60" />
        <Link
          href={`/cities/${citySlug}` as `/${string}`}
          className="hover:text-primary-600 dark:hover:text-primary-400"
        >
          {cityName}
        </Link>
        <ChevronRightIcon className="h-4 w-4 opacity-60" />
        <Link
          href={`/cities/${citySlug}/directory` as `/${string}`}
          className="hover:text-primary-600 dark:hover:text-primary-400"
        >
          {t('breadcrumb.directory')}
        </Link>
        <ChevronRightIcon className="h-4 w-4 opacity-60" />
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{categoryLabel}</span>
      </nav>

      <header className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-400">
              {cityName}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-100">
              {categoryLabel}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
              {t('subtitle', { city: cityName, category: categoryLabel.toLowerCase() })}
            </p>
          </div>
          <p className="shrink-0 text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {t('count', { count: businesses.length })}
          </p>
        </div>
      </header>

      {businesses.length === 0 ? (
        <EmptyState citySlug={citySlug} t={t} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <BusinessListItem key={business.id} business={business} />
          ))}
        </ul>
      )}

      <div className="pt-2">
        <Link
          href={`/cities/${citySlug}` as `/${string}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {headerT('portal.underConstruction.backToPortal')}
        </Link>
      </div>
    </div>
  );
}

interface BusinessListItemProps {
  business: CityBusinessListing;
}

function BusinessListItem({ business }: BusinessListItemProps) {
  const cover = business.adImageUrl ?? business.coverUrl ?? business.logoUrl;
  const initial = business.name.charAt(0).toUpperCase();

  return (
    <li>
      <Link
        href={`/feed/businesses/${business.slug}` as `/${string}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary-100 via-primary-200 to-primary-300 dark:from-primary-900/40 dark:via-primary-800/40 dark:to-primary-700/40">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-5xl font-extrabold text-primary-700/70 dark:text-primary-300/70"
            >
              {initial}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h2 className="text-base font-semibold leading-snug text-neutral-900 group-hover:text-primary-700 dark:text-neutral-100 dark:group-hover:text-primary-400">
            {business.name}
          </h2>
          {business.description && (
            <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
              {business.description}
            </p>
          )}

          <dl className="mt-auto space-y-1 pt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {business.address && (
              <div className="inline-flex items-start gap-1.5">
                <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <dd className="line-clamp-1">{business.address}</dd>
              </div>
            )}
            {business.phone && (
              <div className="inline-flex items-start gap-1.5">
                <PhoneIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <dd>{business.phone}</dd>
              </div>
            )}
            {business.website && (
              <div className="inline-flex items-start gap-1.5">
                <GlobeAltIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <dd className="line-clamp-1">{business.website}</dd>
              </div>
            )}
          </dl>

          {business.averageRating !== null && business.averageRating > 0 && (
            <p className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <StarIcon className="h-3.5 w-3.5" />
              {business.averageRating.toFixed(1)}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

interface EmptyStateProps {
  citySlug: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

function EmptyState({ citySlug, t }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-900">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('empty')}</p>
      <Link
        href={`/cities/${citySlug}/directory` as `/${string}`}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
      >
        {t('emptyCta')}
      </Link>
    </div>
  );
}
