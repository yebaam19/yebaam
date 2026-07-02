import { getTranslations } from 'next-intl/server';
import { ShieldCheckIcon } from '@/components/icons/heroicons-shim';

interface Props {
  /** `pill` = icon + text (detail page); `dot` = icon-only circle (cards). */
  variant?: 'pill' | 'dot';
}

/** "Emprendedor verificado" — only rendered for APPROVED emprendimientos. */
export async function VerifiedEntrepreneurBadge({ variant = 'pill' }: Props) {
  const t = await getTranslations('cities.emprendimientos.badge');
  if (variant === 'dot') {
    return (
      <span
        title={t('verified')}
        aria-label={t('verified')}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white"
      >
        <ShieldCheckIcon className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
      <ShieldCheckIcon className="h-3.5 w-3.5" />
      {t('verified')}
    </span>
  );
}
