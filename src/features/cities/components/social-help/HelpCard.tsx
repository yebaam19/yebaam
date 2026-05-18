import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import type { HelpDetail } from '@/features/cities/server/social-help.server';

interface HelpCardProps {
  citySlug: string;
  item: HelpDetail;
}

/**
 * Single social-help card. RSC; mirrors `ClassifiedCard` structure but with
 * a singular optional image and the kind badge driving the chip color so
 * "offer" and "need" read at a glance.
 */
export async function HelpCard({ citySlug, item }: HelpCardProps) {
  const t = await getTranslations('cities.socialHelp');
  return (
    <Link
      href={`/cities/${citySlug}/social-help/${item.id}` as Route}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {item.imageUrl && (
        <div className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-900">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1.5 px-4 py-4">
        <span
          className={
            item.kind === 'offer'
              ? 'inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'inline-flex w-fit items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
          }
        >
          {t(`kinds.${item.kind}`)}
        </span>
        <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {item.title}
        </h3>
        {item.description && (
          <p className="line-clamp-3 text-xs text-neutral-600 dark:text-neutral-400">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
}
