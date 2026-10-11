'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { CommunitySection } from '../types/communityPlan.types';
import { PLAN_KINDS, planPath } from '../utils/plan-navigation';

export function CommunityInstitutionalNav({ slug, sections, canManage, legacyRules }: {
  slug: string; sections: CommunitySection[]; canManage: boolean; legacyRules: boolean;
}) {
  const t = useTranslations('communities.plans');
  const pathname = usePathname();
  const tabs = (['about', ...PLAN_KINDS, 'leaders'] as const).flatMap((kind, index) => {
    const section = sections.find((item) => item.kind === kind);
    if (!section && !canManage && !(kind === 'rules' && legacyRules)) return [];
    return [{ kind, title: section?.title ?? t(`titles.${kind}`), position: section?.position ?? index,
      hidden: section ? !section.is_visible : canManage && !(kind === 'rules' && legacyRules) }];
  }).sort((a, b) => a.position - b.position || a.kind.localeCompare(b.kind));
  if (!tabs.length) return null;
  return <nav aria-label={t('navigation')} className="thin-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-700">
    {tabs.map((tab) => {
      const href = tab.kind === 'about' || tab.kind === 'leaders'
        ? `/feed/comunidades/${encodeURIComponent(slug)}/${tab.kind === 'about' ? 'acerca' : 'lideres'}` : planPath(slug, tab.kind);
      const active = pathname === href || (tab.kind === 'leaders' && pathname.startsWith(`${href}/`));
      return <Link key={tab.kind} href={href as Route} aria-current={active ? 'page' : undefined}
        className={`shrink-0 rounded-t-lg px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300 ${active
          ? 'bg-[var(--community-secondary)] text-[var(--community-primary)]'
          : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'}`}>
        {tab.title}{tab.hidden && <span className="ml-2 text-xs">({t('hidden')})</span>}
      </Link>;
    })}
  </nav>;
}
