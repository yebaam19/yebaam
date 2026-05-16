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
      className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-20 -mx-4 mb-6 border-b border-zinc-200/90 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-zinc-800/90"
    >
      <ul className="flex items-center gap-6 overflow-x-auto text-sm">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.href} className="shrink-0">
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'inline-flex border-b-2 border-zinc-900 py-2.5 font-medium text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                    : 'inline-flex border-b-2 border-transparent py-2.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
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
