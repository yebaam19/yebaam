'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type TabKey =
  | 'home'
  | 'members'
  | 'tree'
  | 'timeline'
  | 'photos'
  | 'stories'
  | 'documents'
  | 'settings';

interface TabItem {
  id: string;
  labelKey: TabKey;
  href: string;
  comingSoon?: boolean;
}

function buildTabs(slug: string, isAdmin: boolean): TabItem[] {
  const base = `/feed/familias/${slug}`;
  const tabs: TabItem[] = [
    { id: 'home', labelKey: 'home', href: base },
    { id: 'miembros', labelKey: 'members', href: `${base}/miembros` },
    { id: 'arbol', labelKey: 'tree', href: `${base}/arbol` },
    { id: 'timeline', labelKey: 'timeline', href: `${base}/timeline` },
    { id: 'fotos', labelKey: 'photos', href: `${base}/fotos` },
    { id: 'historias', labelKey: 'stories', href: `${base}/historias` },
    { id: 'documentos', labelKey: 'documents', href: `${base}/documentos` },
  ];
  if (isAdmin) {
    tabs.push({ id: 'configuracion', labelKey: 'settings', href: `${base}/configuracion` });
  }
  return tabs;
}

export function FamilyTopTabs({ slug, isAdmin = false }: { slug: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const t = useTranslations('familias');
  const tabs = buildTabs(slug, isAdmin);
  return (
    <div
      role="tablist"
      aria-label={t('tabs.ariaLabel')}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {tabs.map((tab) => {
        const isActive =
          tab.id === 'home' ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.id}
            href={tab.href as Route}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.comingSoon}
            onClick={tab.comingSoon ? (e) => e.preventDefault() : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-emerald-600 text-white shadow-sm'
                : tab.comingSoon
                  ? 'text-zinc-400 cursor-not-allowed dark:text-zinc-600'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800',
            )}
          >
            {t(`tabs.${tab.labelKey}`)}
            {tab.comingSoon && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                )}
              >
                {t('tabs.comingSoon')}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
