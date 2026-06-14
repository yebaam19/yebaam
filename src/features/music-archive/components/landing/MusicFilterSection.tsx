import Link from 'next/link';
import type { Route } from 'next';
import { pillClass } from '@/features/music-archive/lib/pill-class';

export interface FilterPill {
  key: string;
  label: string;
  href: Route;
  active: boolean;
}

interface Props {
  heading: string;
  pills: FilterPill[];
}

/** One labelled row of filter pills on the `/musica` landing page. Pure
 *  presentation — navigation is plain `<Link>` hrefs, no client state — so the
 *  four filter axes (decade, trade, condition, country) share one component
 *  instead of repeating the same markup. */
export function MusicFilterSection({ heading, pills }: Props) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">{heading}</h2>
      <div className="flex flex-wrap gap-2">
        {pills.map((p) => (
          <Link key={p.key} href={p.href} className={pillClass(p.active)} aria-pressed={p.active}>
            {p.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
