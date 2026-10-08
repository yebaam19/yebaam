import { getTranslations } from 'next-intl/server';

export default async function LibraryLoading() {
  const t = await getTranslations('communities.library');
  return <div role="status" className="rounded-xl bg-white p-5 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">{t('loading')}</div>;
}
