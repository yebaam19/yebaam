import Link from 'next/link';
import type { Route } from 'next';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeftIcon } from '@/components/icons/heroicons-shim';
import { getClassifiedById } from '@/features/cities/server/classifieds.server';
import { getCityBySlug } from '@/features/cities/server/city.server';

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getClassifiedById(id);
  return {
    title: item?.title ?? 'Clasificado',
    description: item?.description ?? undefined,
  };
}

function formatPrice(
  priceCents: number | null,
  currency: string,
  freeLabel: string,
): string {
  if (priceCents === null) return '';
  if (priceCents === 0) return freeLabel;
  const value = priceCents / 100;
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(0)} ${currency}`;
  }
}

/**
 * `/cities/[slug]/classifieds/[id]` — RSC detail view.
 *
 * Renders the full title + description, a kind chip, and a simple image
 * gallery from `cf_image_ids[]`. Anonymous viewers can read; the composer
 * is on a different route, so we do not need to gate this page on auth.
 */
export default async function ClassifiedDetailPage({ params }: Props) {
  const { slug, id } = await params;
  const [city, item] = await Promise.all([
    getCityBySlug(slug),
    getClassifiedById(id),
  ]);
  if (!city || !item || item.cityId !== city.id) notFound();

  const t = await getTranslations('cities.classifieds');
  const priceLabel = formatPrice(item.priceCents, item.currency, t('detail.free'));

  return (
    <article className="space-y-5">
      <Link
        href={`/cities/${slug}/classifieds` as Route}
        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t('detail.back')}
      </Link>

      <header className="space-y-2">
        <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
          {t(`kinds.${item.kind}`)}
        </span>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
          {item.title}
        </h1>
        {priceLabel && (
          <p className="text-xl font-semibold text-primary-700 dark:text-primary-300">
            {priceLabel}
          </p>
        )}
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('detail.publishedAt', {
            date: new Date(item.createdAt).toLocaleDateString(),
          })}
        </p>
      </header>

      {item.imageUrls.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {item.imageUrls.map((url, i) => (
            <div
              key={url}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <img
                src={url}
                alt={`${item.title} ${i + 1}`}
                className="h-full w-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white px-5 py-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <p className="whitespace-pre-line text-sm text-neutral-800 dark:text-neutral-200">
          {item.description?.trim() ? item.description : t('detail.noDescription')}
        </p>
      </section>
    </article>
  );
}
