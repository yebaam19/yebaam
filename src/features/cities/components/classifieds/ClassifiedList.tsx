import { getTranslations } from 'next-intl/server';
import type { ClassifiedDetail } from '@/features/cities/server/classifieds.server';
import { ClassifiedCard } from './ClassifiedCard';

interface ClassifiedListProps {
  citySlug: string;
  items: ClassifiedDetail[];
}

/**
 * Responsive grid of classifieds + a polished empty-state. RSC: every card
 * is a server component too, so the page ships zero classified-specific JS.
 */
export async function ClassifiedList({ citySlug, items }: ClassifiedListProps) {
  const t = await getTranslations('cities.classifieds.list');

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center dark:border-neutral-700 dark:bg-neutral-800">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {t('empty')}
        </p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {t('emptyHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ClassifiedCard key={item.id} citySlug={citySlug} item={item} />
      ))}
    </div>
  );
}
