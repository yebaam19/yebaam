'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';

interface Tab {
  /** Translation key suffix under `musica.nav.*` */
  key: 'explore' | 'clubs' | 'blog' | 'upload' | 'about';
  href: Route;
  match: (pathname: string) => boolean;
}

const TABS: Tab[] = [
  {
    key: 'explore',
    href: '/musica' as Route,
    match: (p) =>
      p === '/musica' ||
      p.startsWith('/musica/albumes') ||
      p.startsWith('/musica/artistas') ||
      p.startsWith('/musica/sellos'),
  },
  {
    key: 'clubs',
    href: '/musica/clubes' as Route,
    match: (p) => p.startsWith('/musica/clubes'),
  },
  {
    key: 'blog',
    href: '/musica/blog' as Route,
    match: (p) => p.startsWith('/musica/blog'),
  },
  {
    key: 'upload',
    href: '/musica/subir' as Route,
    match: (p) => p.startsWith('/musica/subir'),
  },
  {
    key: 'about',
    href: '/musica/acerca' as Route,
    match: (p) => p.startsWith('/musica/acerca'),
  },
];

/** Persistent secondary navigation for the music archive module. Lives just
 *  below the main app header so the "Acerca del Club" link is one click away
 *  from any subpage. */
export function MusicaSubNav() {
  const t = useTranslations('musica');
  const pathname = usePathname() ?? '';
  return (
    <nav
      aria-label={t('nav.ariaLabel')}
      className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-20 -mx-4 mb-6 border-b border-zinc-200/90 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-zinc-800/90"
    >
      <ul className="flex items-center gap-6 overflow-x-auto text-sm">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="shrink-0">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'inline-flex border-b-2 border-zinc-900 py-2.5 font-medium text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                    : 'inline-flex border-b-2 border-transparent py-2.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }
              >
                {t(`nav.${tab.key}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
