import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import type { ClassifiedDetail } from '@/features/cities/server/classifieds.server';

interface ClassifiedCardProps {
  citySlug: string;
  item: ClassifiedDetail;
}

function formatPrice(priceCents: number | null, currency: string, freeLabel: string): string {
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
 * Single-classified card rendered in the grid. RSC by design — zero client
 * JS. The image is the first uploaded CF image (or a placeholder pill);
 * the kind/price are pills layered over the thumbnail so the title space
 * does not get crowded on narrow viewports.
 */
export async function ClassifiedCard({ citySlug, item }: ClassifiedCardProps) {
  const t = await getTranslations('cities.classifieds');
  const cover = item.imageUrls[0];
  const priceLabel = formatPrice(item.priceCents, item.currency, t('list.free'));

  return (
    <Link
      href={`/cities/${citySlug}/classifieds/${item.id}` as Route}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <div className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-900">
        {cover ? (
          <img
            src={cover}
            alt={item.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wide text-neutral-400">
            {t(`kinds.${item.kind}`)}
          </div>
        )}
        <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700 shadow-sm dark:bg-neutral-900/95 dark:text-primary-300">
          {t(`kinds.${item.kind}`)}
        </span>
        {priceLabel && (
          <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-primary-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            {priceLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3 py-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {item.title}
        </h3>
        {item.description && (
          <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
}
