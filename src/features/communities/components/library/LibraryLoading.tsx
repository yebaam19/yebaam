import { getTranslations } from 'next-intl/server';

export default async function LibraryLoading() {
  const t = await getTranslations('communities.library');
  return <div role="status" className="rounded-xl bg-white p-5 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{t('loading')}</div>;
}
