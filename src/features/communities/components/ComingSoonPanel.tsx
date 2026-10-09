import type { ComponentType, SVGProps } from 'react';
import { getTranslations } from 'next-intl/server';

interface ComingSoonPanelProps {
  title: string;
  description?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

export async function ComingSoonPanel({ title, description, icon: Icon }: ComingSoonPanelProps) {
  const t = await getTranslations('communities');
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 dark:bg-primary-900/30">
          <Icon className="h-6 w-6 text-primary-800 dark:text-primary-300" />
        </div>
      )}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        {description ?? t('comingSoon.defaultDescription')}
      </p>
      <span className="mt-4 inline-block rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium px-3 py-1">
        {t('comingSoon.badge')}
      </span>
    </div>
  );
}
