import { getTranslations } from 'next-intl/server';
import type { HelpDetail } from '@/features/cities/server/social-help.server';
import { HelpCard } from './HelpCard';

interface HelpListProps {
  citySlug: string;
  items: HelpDetail[];
}

export async function HelpList({ citySlug, items }: HelpListProps) {
  const t = await getTranslations('cities.socialHelp.list');

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
        <HelpCard key={item.id} citySlug={citySlug} item={item} />
      ))}
    </div>
  );
}
