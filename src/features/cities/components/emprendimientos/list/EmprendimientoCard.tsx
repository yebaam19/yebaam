import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { HandThumbUpIcon, MapPinIcon } from '@/components/icons/heroicons-shim';
import {
  AWNING_STRIPES,
  EMPRENDIMIENTO_CATEGORY_CHIP,
  EMPRENDIMIENTO_CATEGORY_EMOJI,
  EMPRENDIMIENTO_CATEGORY_GRADIENT,
} from '@/features/cities/data/emprendimientos';
import type { EmprendimientoSummary } from '@/features/cities/server/emprendimientos.server';
import { VerifiedEntrepreneurBadge } from '../VerifiedEntrepreneurBadge';

interface Props {
  citySlug: string;
  item: EmprendimientoSummary;
}

/**
 * Grid card for one emprendimiento. RSC — zero client JS. Photo-less stalls
 * get their category's "market awning": colored gradient + diagonal stripes
 * + a big emoji, so every card reads at a glance even without uploads.
 */
export async function EmprendimientoCard({ citySlug, item }: Props) {
  const t = await getTranslations('cities.emprendimientos');
  return (
    <Link
      href={`/cities/${citySlug}/emprendimientos/${item.id}` as Route}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <div className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-900">
        {item.heroImageUrl ? (
          <img
            src={item.heroImageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center ${EMPRENDIMIENTO_CATEGORY_GRADIENT[item.category]}`}
          >
            <div className="absolute inset-0" style={AWNING_STRIPES} aria-hidden="true" />
            <span
              className="relative text-6xl drop-shadow-lg transition-transform group-hover:scale-110"
              aria-hidden="true"
            >
              {EMPRENDIMIENTO_CATEGORY_EMOJI[item.category]}
            </span>
          </div>
        )}
        <span
          className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${EMPRENDIMIENTO_CATEGORY_CHIP[item.category]}`}
        >
          <span aria-hidden="true">{EMPRENDIMIENTO_CATEGORY_EMOJI[item.category]}</span>
          {t(`categories.${item.category}`)}
        </span>
        {item.recommendationsCount > 0 && (
          <span
            aria-label={t('list.recommendations', { count: item.recommendationsCount })}
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
          >
            <HandThumbUpIcon className="h-3 w-3" />
            {item.recommendationsCount}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3 py-3">
        <div className="flex items-center gap-1.5">
          <h3 className="line-clamp-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {item.name}
          </h3>
          <VerifiedEntrepreneurBadge variant="dot" />
        </div>
        <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
          {item.shortDescription}
        </p>
        {item.zone && (
          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
            <MapPinIcon className="h-3 w-3" />
            {item.zone}
          </span>
        )}
      </div>
    </Link>
  );
}
