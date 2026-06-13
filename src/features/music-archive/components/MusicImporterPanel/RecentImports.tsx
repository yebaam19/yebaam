import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations, useLocale } from 'next-intl';

export interface RecentImport {
  id: string;
  source: string;
  source_url: string;
  status: string;
  created_album_id: string | null;
  error_detail: string | null;
  created_at: string;
}

interface Props {
  recentImports: RecentImport[];
  recentError: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  processing: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  imported: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  failed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  skipped: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

export function RecentImports({ recentImports, recentError }: Props) {
  const t = useTranslations('musica.importer');
  const locale = useLocale();

  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {t('recentHeading')}
      </h2>
      {recentError && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {recentError}
        </p>
      )}
      {recentImports.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40">
          {t('recentEmpty')}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/50">
              <tr>
                <th className="px-3 py-2">{t('colDate')}</th>
                <th className="px-3 py-2">{t('colSource')}</th>
                <th className="px-3 py-2">{t('colStatus')}</th>
                <th className="px-3 py-2">{t('colUrl')}</th>
                <th className="px-3 py-2">{t('colAlbum')}</th>
              </tr>
            </thead>
            <tbody>
              {recentImports.map((imp) => (
                <tr
                  key={imp.id}
                  className="border-t border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <td className="px-3 py-2 tabular-nums text-zinc-500">
                    {new Date(imp.created_at).toLocaleString(locale, {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{imp.source}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        STATUS_BADGE[imp.status] ?? STATUS_BADGE.pending
                      }`}
                    >
                      {imp.status}
                    </span>
                  </td>
                  <td className="max-w-xs px-3 py-2">
                    <a
                      href={imp.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-amber-700 hover:underline dark:text-amber-400"
                      title={imp.source_url}
                    >
                      {imp.source_url}
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    {imp.created_album_id ? (
                      <Link
                        href={`/musica` as Route}
                        className="text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        {t('viewAlbum')}
                      </Link>
                    ) : imp.error_detail ? (
                      <span className="text-rose-600" title={imp.error_detail}>
                        {imp.error_detail.slice(0, 40)}…
                      </span>
                    ) : (
                      t('emptyDash')
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
