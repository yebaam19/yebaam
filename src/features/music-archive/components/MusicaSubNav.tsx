'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';

interface Tab {
  label: string;
  href: Route;
  /** Match the start of pathname, but skip if `exact` is true. */
  match: (pathname: string) => boolean;
}

const TABS: Tab[] = [
  {
    label: 'Explorar',
    href: '/musica' as Route,
    match: (p) =>
      p === '/musica' ||
      p.startsWith('/musica/albumes') ||
      p.startsWith('/musica/artistas') ||
      p.startsWith('/musica/sellos'),
  },
  {
    label: 'Clubes',
    href: '/musica/clubes' as Route,
    match: (p) => p.startsWith('/musica/clubes'),
  },
  {
    label: 'Subir',
    href: '/musica/subir' as Route,
    match: (p) => p.startsWith('/musica/subir'),
  },
  {
    label: 'Acerca',
    href: '/musica/acerca' as Route,
    match: (p) => p.startsWith('/musica/acerca'),
  },
];

/** Persistent secondary navigation for the music archive module. Lives just
 *  below the main app header so the "Acerca del Club" link is one click away
 *  from any subpage. */
export function MusicaSubNav() {
  const pathname = usePathname() ?? '';
  return (
    <nav
      aria-label="Club de Coleccionistas"
      className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-20 -mx-4 mb-2 border-b border-zinc-200 bg-white/85 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-zinc-800 dark:bg-zinc-950/85"
    >
      <ul className="flex items-center gap-1 overflow-x-auto py-2 text-sm">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                    : 'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                }
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
