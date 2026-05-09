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

function buildTabs(slug: string, isAdmin: boolean): TabItem[] {
  const base = `/feed/familias/${slug}`;
  const tabs: TabItem[] = [
    { id: 'home', label: 'Inicio', href: base },
    { id: 'miembros', label: 'Miembros', href: `${base}/miembros` },
    { id: 'arbol', label: 'Árbol', href: `${base}/arbol` },
    { id: 'timeline', label: 'Línea de tiempo', href: `${base}/timeline` },
    { id: 'fotos', label: 'Fotos', href: `${base}/fotos` },
    { id: 'historias', label: 'Historias', href: `${base}/historias` },
    { id: 'documentos', label: 'Documentos', href: `${base}/documentos` },
  ];
  if (isAdmin) {
    tabs.push({ id: 'configuracion', label: 'Configuración', href: `${base}/configuracion` });
  }
  return tabs;
}

export function FamilyTopTabs({ slug, isAdmin = false }: { slug: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const tabs = buildTabs(slug, isAdmin);
  return (
    <div
      role="tablist"
      aria-label="Pestañas de la familia"
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
            {tab.label}
            {tab.comingSoon && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
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
