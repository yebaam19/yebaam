import Link from 'next/link';
import type { Metadata, Route } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('musica');
  return {
    title: t('about.metaTitle'),
    description: t('about.metaDescription'),
  };
}

export default async function AcercaPage() {
  const t = await getTranslations('musica');
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav className="text-xs">
        <Link
          href={'/musica' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {t('about.backToArchive')}
        </Link>
      </nav>

      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          {t('about.kicker')}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          {t('about.title')}
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          {t('about.subtitle')}
        </p>
      </header>

      <section className="space-y-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t('about.purposeHeading')}
        </h2>
        <p>
          {t('about.purposeP1Prefix')}
          <strong>{t('about.purposeP1Strong')}</strong>
          {t('about.purposeP1Suffix')}
        </p>
        <p>
          {t('about.purposeP2Prefix')}
          <strong>{t('about.purposeP2Strong')}</strong>
          {t('about.purposeP2Suffix')}
        </p>
      </section>

      <section className="space-y-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t('about.rightsHeading')}
        </h2>
        <p>{t('about.rightsP1')}</p>
        <p>{t('about.rightsP2')}</p>
      </section>

      <section className="space-y-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t('about.collabHeading')}
        </h2>
        <p>{t('about.collabP1')}</p>
      </section>
    </div>
  );
}
