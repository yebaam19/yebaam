import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { requirePlatformAdmin } from '@/features/music-archive/server/music.server';
import { listRecentImports } from '@/features/music-archive/actions/import.actions';
import { listAdminAlbums } from '@/features/music-archive/actions/albums.actions';
import { listAdminArtists } from '@/features/music-archive/actions/artists.actions';
import { listAdminLabels } from '@/features/music-archive/actions/labels.actions';
import {
  listAllMusicClubMembers,
  listMusicClubsForAdmin,
  listRecentMusicClubArticles,
  listRecentMusicClubPosts,
} from '@/features/music-archive/actions/club-admin.actions';
import { listPendingJoinRequests } from '@/features/music-archive/actions/club-roles.actions';
import { listAdminMusicMedia } from '@/features/music-archive/actions/music-media.actions';
import { listGenresWithUsage } from '@/features/music-archive/actions/genres.actions';
import { getMusicArchiveStats } from '@/features/music-archive/actions/admin-stats.actions';
import { AdminMusicTabs } from '@/features/music-archive/components/AdminMusicTabs';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = { title: 'Admin · Música' };

export default async function AdminMusicPage() {
  const admin = await requirePlatformAdmin();
  if (!admin) redirect('/admin/foros' as Route);

  const t = await getTranslations('admin.music');

  const [recent, albums, artists, labels, pending, members, clubs, posts, articles, media, genres, stats] =
    await Promise.all([
      listRecentImports(50),
      listAdminAlbums(),
      listAdminArtists(),
      listAdminLabels(),
      listPendingJoinRequests(),
      listAllMusicClubMembers(),
      listMusicClubsForAdmin(),
      listRecentMusicClubPosts(30),
      listRecentMusicClubArticles(30),
      listAdminMusicMedia(200),
      listGenresWithUsage(),
      getMusicArchiveStats(),
    ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('title')}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t('subtitle')}
        </p>
      </header>
      <AdminMusicTabs
        recentImports={recent.ok ? recent.data : []}
        recentError={recent.ok ? null : recent.error}
        initialAlbums={albums.ok ? albums.data : []}
        initialArtists={artists.ok ? artists.data : []}
        initialLabels={labels.ok ? labels.data : []}
        pendingRequests={pending.ok ? pending.data : []}
        allMembers={members.ok ? members.data : []}
        clubs={clubs.ok ? clubs.data : []}
        recentPosts={posts.ok ? posts.data : []}
        recentArticles={articles.ok ? articles.data : []}
        recentMedia={media.ok ? media.data : []}
        genres={genres.ok ? genres.data : []}
        stats={stats.ok ? stats.data : null}
        statsError={stats.ok ? null : stats.error}
      />
    </div>
  );
}
