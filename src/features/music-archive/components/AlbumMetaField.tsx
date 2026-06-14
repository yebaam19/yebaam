import Link from 'next/link';
import type { Route } from 'next';

interface Props {
  label: string;
  value: string;
  href?: string;
  /** Monospaced + word-break for catalog numbers / long IDs that have no
   *  natural break points. */
  mono?: boolean;
}

/** One `<dt>/<dd>` cell in the album detail metadata grid. */
export function AlbumMetaField({ label, value, href, mono }: Props) {
  const valueClass = `text-sm text-zinc-900 dark:text-zinc-100 ${
    mono ? 'break-all font-mono text-[13px]' : 'break-words'
  }`;
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className={valueClass}>
        {href ? (
          <Link href={href as Route} className="hover:underline">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
