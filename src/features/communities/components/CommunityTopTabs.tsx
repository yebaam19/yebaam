'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  href: string;
  comingSoon?: boolean;
}

function buildTabs(slug: string): TabItem[] {
  const base = `/feed/comunidades/${slug}`;
  return [
    { id: 'home', label: 'Publicaciones', href: base },
    { id: 'fotos', label: 'Fotos', href: `${base}/fotos` },
    { id: 'videos', label: 'Videos', href: `${base}/videos` },
    { id: 'articulos', label: 'Articulos', href: `${base}/articulos`, comingSoon: true },
    { id: 'archivos', label: 'Archivos', href: `${base}/archivos`, comingSoon: true },
    { id: 'pdf', label: 'PDF', href: `${base}/pdf`, comingSoon: true },
  ];
}

interface CommunityTopTabsProps {
  slug: string;
}

export function CommunityTopTabs({ slug }: CommunityTopTabsProps) {
  const pathname = usePathname();
  const tabs = buildTabs(slug);

  return (
    <div
      role="tablist"
      aria-label="Pestañas de contenido"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5"
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
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60',
            )}
          >
            {tab.label}
            {tab.comingSoon && (
              <span
                className={cn(
                  'rounded-full text-[9px] font-medium px-1.5 py-0.5',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
                )}
              >
                Pronto
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
