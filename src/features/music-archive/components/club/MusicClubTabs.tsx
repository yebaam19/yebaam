'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';

interface Props {
  slug: string;
}

type TabKey = 'tabAlbumes' | 'tabPosts' | 'tabForum' | 'tabArticles' | 'tabGallery' | 'tabArtists' | 'tabMembers' | 'tabLinks' | 'tabRules';

const TABS: Array<{ key: TabKey; suffix: string }> = [
  { key: 'tabAlbumes', suffix: '' },
  { key: 'tabPosts', suffix: '/posts' },
  { key: 'tabForum', suffix: '/foro' },
  { key: 'tabArticles', suffix: '/articulos' },
  { key: 'tabGallery', suffix: '/galeria' },
  { key: 'tabArtists', suffix: '/artistas' },
  { key: 'tabMembers', suffix: '/miembros' },
  { key: 'tabLinks', suffix: '/links' },
  { key: 'tabRules', suffix: '/reglas' },
];

/** Horizontal tab strip rendered above each club sub-route. The "Discos" tab
 *  is active when the path is the bare club detail (no suffix). */
export function MusicClubTabs({ slug }: Props) {
  const t = useTranslations('musica');
  const pathname = usePathname();
  const base = `/musica/clubes/${slug}`;
  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((tab) => {
          const href = `${base}${tab.suffix}`;
          const active =
            tab.suffix === ''
              ? pathname === base || pathname === `${base}/`
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={tab.key}>
              <Link
                href={href as Route}
                className={
                  'inline-block whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ' +
                  (active
                    ? 'border-amber-600 font-semibold text-zinc-900 dark:border-amber-400 dark:text-zinc-100'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200')
                }
              >
                {t(`club.${tab.key}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
