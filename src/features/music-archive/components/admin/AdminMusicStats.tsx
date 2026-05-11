'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type { MusicArchiveStats } from '../../actions/admin-stats.actions';

interface Props {
  stats: MusicArchiveStats | null;
  error: string | null;
}

const FORMATTER = new Intl.NumberFormat('es-CO');

export function AdminMusicStats({ stats, error }: Props) {
  if (error) {
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
        {error}
      </p>
    );
  }
  if (!stats) {
    return <p className="text-sm text-zinc-500">Cargando estadísticas…</p>;
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => downloadJson(stats)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          Descargar JSON
        </button>
      </div>
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Totales
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Usuarios" value={stats.totals.profiles} />
          <StatCard label="Clubes" value={stats.totals.music_clubs} />
          <StatCard label="Artistas" value={stats.totals.music_artists} />
          <StatCard label="Álbumes" value={stats.totals.music_albums} />
          <StatCard label="Canciones" value={stats.totals.music_tracks} />
          <StatCard label="Fotos / videos" value={stats.totals.music_media} />
          <StatCard
            label="Disponibles para intercambio"
            value={stats.totals.for_trade_albums}
            highlight
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Álbumes por género
        </h3>
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {stats.albumsByGenre.map((g) => (
            <li key={g.genre_id} className="flex items-center gap-3 p-3 text-sm">
              <span className="flex-1 font-medium text-zinc-900 dark:text-zinc-100">{g.genre_name}</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                {FORMATTER.format(g.album_count)} álbumes
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {FORMATTER.format(g.member_count)} miembros
              </span>
            </li>
          ))}
          {stats.albumsByGenre.length === 0 && (
            <li className="p-4 text-center text-xs text-zinc-500">Sin géneros para mostrar.</li>
          )}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Top 10 clubes más activos
        </h3>
        <p className="mb-2 text-xs text-zinc-500">
          Score = miembros + 0.5 × posts + 0.5 × artículos.
        </p>
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {stats.topClubs.map((c, i) => (
            <li key={c.club_id} className="flex items-center gap-3 p-3 text-sm">
              <span className="w-6 text-right font-mono text-xs text-zinc-400">{i + 1}.</span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/musica/clubes/${c.club_slug}` as Route}
                  className="truncate font-medium text-amber-700 hover:underline dark:text-amber-300"
                >
                  {c.club_name}
                </Link>
                <p className="truncate text-xs text-zinc-500">{c.genre_name}</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {FORMATTER.format(c.member_count)} miembros
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {FORMATTER.format(c.post_count)} posts
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {FORMATTER.format(c.article_count)} art.
              </span>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                {c.score.toFixed(1)}
              </span>
            </li>
          ))}
          {stats.topClubs.length === 0 && (
            <li className="p-4 text-center text-xs text-zinc-500">Sin clubes para mostrar.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function downloadJson(stats: MusicArchiveStats) {
  const payload = JSON.stringify(
    { generated_at: new Date().toISOString(), ...stats },
    null,
    2,
  );
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `music-archive-stats-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        'rounded-xl border p-3 ' +
        (highlight
          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900')
      }
    >
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={
          'mt-1 text-2xl font-bold tabular-nums ' +
          (highlight ? 'text-emerald-700 dark:text-emerald-200' : 'text-zinc-900 dark:text-zinc-100')
        }
      >
        {FORMATTER.format(value)}
      </p>
    </div>
  );
}
