import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import type { CommunitySection } from '../types/communityPlan.types';
import { planPath } from '../utils/plan-navigation';

export async function CommunityFeaturedSections({ slug, sections }: {
  slug: string; sections: CommunitySection[];
}) {
  const featured = sections.filter((section) => section.is_visible && section.is_featured);
  if (!featured.length) return null;
  const t = await getTranslations('communities.detail');
  const base = `/feed/comunidades/${encodeURIComponent(slug)}`;
  return <section aria-labelledby="community-featured-sections" className="space-y-3">
    <h2 id="community-featured-sections" className="text-lg font-semibold text-neutral-900 sm:text-xl dark:text-white">
      {t('featuredSectionsHeading')}
    </h2>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {featured.map((section, index) => {
        const href = section.kind === 'about' ? `${base}/acerca`
          : section.kind === 'leaders' ? `${base}/lideres` : planPath(slug, section.kind);
        return <Link key={section.id} href={href as Route}
          className="group flex min-w-0 flex-col rounded-xl border border-primary-100 bg-white p-4 shadow-sm transition-colors hover:border-primary-400 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:border-primary-900/50 dark:bg-neutral-800 dark:hover:bg-primary-950/30">
          <span className="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-[var(--community-secondary)] text-sm font-bold text-[var(--community-primary)]" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="break-words text-sm font-semibold text-[var(--community-primary)] dark:text-primary-100">{section.title}</span>
          <span className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{t(`featuredSectionDescriptions.${section.kind}`)}</span>
          <span className="mt-3 text-xs font-semibold text-primary-800 group-hover:underline dark:text-primary-300">{t('exploreSection')} →</span>
        </Link>;
      })}
    </div>
  </section>;
}
