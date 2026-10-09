'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

type TabKey = 'posts' | 'photos' | 'videos' | 'articles' | 'files' | 'pdf';

interface TabItem {
  id: string;
  labelKey: TabKey;
  href: string;
}

function buildTabs(slug: string): TabItem[] {
  const base = `/feed/comunidades/${slug}`;
  return [
    { id: 'home', labelKey: 'posts', href: base },
    { id: 'fotos', labelKey: 'photos', href: `${base}/fotos` },
    { id: 'videos', labelKey: 'videos', href: `${base}/videos` },
    { id: 'articulos', labelKey: 'articles', href: `${base}/articulos` },
    { id: 'archivos', labelKey: 'files', href: `${base}/archivos` },
    { id: 'pdf', labelKey: 'pdf', href: `${base}/pdf` },
  ];
}

interface CommunityTopTabsProps {
  slug: string;
}

export function CommunityTopTabs({ slug }: CommunityTopTabsProps) {
  const pathname = usePathname();
  const t = useTranslations('communities');
  const tabs = buildTabs(slug);
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navigation.current;
    const selected = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && selected) nav.scrollLeft = Math.max(0, selected.offsetLeft - nav.offsetLeft - 12);
  }, [pathname]);

  return (
    <nav
      ref={navigation}
      aria-label={t('topTabs.ariaLabel')}
      className="flex items-center gap-1 overflow-x-auto rounded-lg border border-neutral-200 bg-white p-1.5 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {tabs.map((tab) => {
        const isActive =
          tab.id === 'home' ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.id}
            href={tab.href as Route}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300',
              isActive
                ? 'bg-[var(--community-primary)] text-white shadow-sm'
                : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700/60',
            )}
          >
            {t(`topTabs.${tab.labelKey}`)}
          </Link>
        );
      })}
    </nav>
  );
}
