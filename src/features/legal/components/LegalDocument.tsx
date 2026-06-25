import { getTranslations } from 'next-intl/server';

import { LEGAL_DOCS, type LegalSlug } from '../content/legal-docs.generated';

interface Props {
  slug: LegalSlug;
}

/**
 * Renders one legal document (Términos, Normas Comunitarias, Reglamento) as a
 * read-only page. Body HTML is produced at build time by `pnpm legal:build`
 * from docs/legal/*.md and rendered with the app's `prose` pattern (same as
 * ArticleView). Chrome strings are i18n'd; the legal body stays in Spanish
 * (its source language).
 */
export async function LegalDocument({ slug }: Props) {
  const doc = LEGAL_DOCS[slug];
  const t = await getTranslations('legal');

  return (
    <article className="mx-auto w-full max-w-3xl">
      <header className="mb-8 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{doc.subtitle}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
          {doc.title}
        </h1>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          {t('updatedAt')}: {doc.updatedAt}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          {t('intro')}
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{t('languageNote')}</p>
      </header>

      <div
        className="prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-headings:text-neutral-900 dark:prose-headings:text-white prose-h2:mt-10 prose-h2:border-b prose-h2:border-neutral-200 prose-h2:pb-2 prose-h2:text-xl prose-h2:font-bold dark:prose-h2:border-neutral-800 prose-h3:mt-7 prose-h3:text-lg prose-h3:font-semibold prose-p:leading-relaxed prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-a:text-primary-600 hover:prose-a:underline dark:prose-a:text-primary-400 prose-strong:text-neutral-900 dark:prose-strong:text-white prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-li:my-1 prose-li:text-neutral-700 dark:prose-li:text-neutral-300"
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />
    </article>
  );
}
