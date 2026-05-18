import Image from 'next/image';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowTrendingUpIcon } from '@/components/icons/heroicons-shim';
import type { CityTrendingItem } from '@/features/cities/server/city.server';

interface CityTrendingListProps {
  citySlug: string;
  items: CityTrendingItem[];
}

function formatRelative(iso: string, locale: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffSec = Math.floor((now - t) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (diffSec < 60) return rtf.format(-diffSec, 'second');
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return rtf.format(-diffHr, 'hour');
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return rtf.format(-diffDay, 'day');
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return rtf.format(-diffMonth, 'month');
  return rtf.format(-Math.floor(diffMonth / 12), 'year');
}

/**
 * "En tendencia" sidebar list. Each item is a `<Link>` to the news detail
 * page (route exists at `/cities/[slug]/news` — individual items deep-link
 * once that index page wires per-item routes). For now the link points at
 * the city's news index.
 */
export async function CityTrendingList({ citySlug, items }: CityTrendingListProps) {
  const t = await getTranslations('cities.portal.trending');
  const locale = await getLocale();

  return (
    <section
      aria-label={t('heading')}
      className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        <ArrowTrendingUpIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        {t('heading')}
      </h2>

      {items.length === 0 ? (
        <p className="py-2 text-xs text-neutral-500 dark:text-neutral-400">{t('empty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/cities/${citySlug}/news` as `/${string}`}
                className="group flex gap-3 rounded-xl p-1.5 -mx-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800">
                  {item.coverImageUrl && (
                    <Image
                      src={item.coverImageUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-neutral-900 group-hover:text-primary-700 dark:text-neutral-100 dark:group-hover:text-primary-400">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                    {formatRelative(item.publishedAt, locale)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
