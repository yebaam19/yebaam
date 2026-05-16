'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { AdminAlbumUploadForm } from './AdminAlbumUploadForm';
import { MusicImporterPanel } from './MusicImporterPanel';
import { AdminAlbumsList } from './admin/AdminAlbumsList';
import { AdminArtistsList } from './admin/AdminArtistsList';
import { AdminLabelsList } from './admin/AdminLabelsList';
import { AdminPendingRequestsTable } from './admin/club-admin/AdminPendingRequestsTable';
import { AdminAllMembersTable } from './admin/club-admin/AdminAllMembersTable';
import { AdminClubsTable } from './admin/club-admin/AdminClubsTable';
import { AdminClubModerationDrawer } from './admin/club-admin/AdminClubModerationDrawer';
import { AdminMusicMediaList } from './admin/AdminMusicMediaList';
import { AdminGenresList, type AdminGenreRow } from './admin/AdminGenresList';
import { AdminMusicStats } from './admin/AdminMusicStats';
import type { MusicMediaItem } from '../types/music-media.types';
import type { MusicArchiveStats } from '../actions/admin-stats.actions';

interface RecentImport {
  id: string;
  source: string;
  source_url: string;
  status: string;
  created_album_id: string | null;
  error_detail: string | null;
  created_at: string;
}

interface AlbumRow {
  id: string;
  title: string;
  slug: string;
  year: number | null;
  country: string | null;
  format: string;
  cover_cf_image_id: string | null;
  catalog_number: string | null;
  condition: string | null;
  for_trade: boolean;
  artist_id: string;
  artist_name: string;
  track_count: number;
}

interface ArtistRow {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  born_year: number | null;
  died_year: number | null;
  bio_short: string | null;
  photo_cf_image_id: string | null;
  album_count: number;
}

interface LabelRow {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  founded: number | null;
  album_count: number;
}

interface PendingRow {
  club_id: string;
  user_id: string;
  joined_at: string;
  club_name: string;
  club_slug: string;
  username: string | null;
  full_name: string | null;
  avatar_cf_image_id: string | null;
}

interface MemberRow {
  user_id: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  role: string;
  joined_at: string;
  username: string | null;
  full_name: string | null;
  avatar_cf_image_id: string | null;
}

interface ClubRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  rules: string[];
  music_genre_id: string;
  genre_slug: string;
  genre_name: string;
  cover_image_url: string | null;
  member_count: number;
  pending_count: number;
  post_count: number;
  article_count: number;
  forum_enabled: boolean;
}

interface PostRow {
  id: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  author_id: string;
  author_name: string | null;
  title: string | null;
  body: string | null;
  created_at: string;
}

interface ArticleRow {
  id: string;
  slug: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  author_id: string;
  author_name: string | null;
  title: string;
  published_at: string | null;
  created_at: string;
}

interface Props {
  recentImports: RecentImport[];
  recentError: string | null;
  initialAlbums: AlbumRow[];
  initialArtists: ArtistRow[];
  initialLabels: LabelRow[];
  pendingRequests: PendingRow[];
  allMembers: MemberRow[];
  clubs: ClubRow[];
  recentPosts: PostRow[];
  recentArticles: ArticleRow[];
  recentMedia: MusicMediaItem[];
  genres: AdminGenreRow[];
  stats: MusicArchiveStats | null;
  statsError: string | null;
}

export function AdminMusicTabs({
  recentImports,
  recentError,
  initialAlbums,
  initialArtists,
  initialLabels,
  pendingRequests,
  allMembers,
  clubs,
  recentPosts,
  recentArticles,
  recentMedia,
  genres,
  stats,
  statsError,
}: Props) {
  const t = useTranslations('musica.admin.tabs');
  const clubOptions = clubs.map((c) => ({ id: c.id, name: c.name }));
  const genreOptions = genres.map((g) => ({ id: g.id, name: g.name }));
  const tabListClass =
    'flex h-auto w-full justify-start overflow-x-auto whitespace-nowrap py-1 ' +
    '[scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 ' +
    '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 ' +
    'dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 ' +
    '[mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]';
  const triggerClass = 'flex-none';
  return (
    <Tabs>
      <TabsList className={tabListClass}>
        <TabsTrigger className={triggerClass}>{t('uploadRecord')}</TabsTrigger>
        <TabsTrigger className={triggerClass}>{t('pasteLink')}</TabsTrigger>
        <TabsTrigger className={triggerClass}>{t('records')}</TabsTrigger>
        <TabsTrigger className={triggerClass}>{t('artists')}</TabsTrigger>
        <TabsTrigger className={triggerClass}>{t('labels')}</TabsTrigger>
        <TabsTrigger className={triggerClass}>
          {t('requests')}
          {pendingRequests.length > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white">
              {pendingRequests.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger className={triggerClass}>{t('members')}</TabsTrigger>
        <TabsTrigger className={triggerClass}>{t('clubs')}</TabsTrigger>
        <TabsTrigger className={triggerClass}>{t('moderate')}</TabsTrigger>
        <TabsTrigger className={triggerClass}>{t('photosVideos')}</TabsTrigger>
        <TabsTrigger className={triggerClass}>{t('genres')}</TabsTrigger>
        <TabsTrigger className={triggerClass}>{t('stats')}</TabsTrigger>
      </TabsList>
      <TabsContent>
        <AdminAlbumUploadForm />
      </TabsContent>
      <TabsContent>
        <MusicImporterPanel recentImports={recentImports} recentError={recentError} />
      </TabsContent>
      <TabsContent>
        <AdminAlbumsList initialAlbums={initialAlbums} />
      </TabsContent>
      <TabsContent>
        <AdminArtistsList initialArtists={initialArtists} />
      </TabsContent>
      <TabsContent>
        <AdminLabelsList initialLabels={initialLabels} />
      </TabsContent>
      <TabsContent>
        <AdminPendingRequestsTable initial={pendingRequests} />
      </TabsContent>
      <TabsContent>
        <AdminAllMembersTable initial={allMembers} clubs={clubOptions} />
      </TabsContent>
      <TabsContent>
        <AdminClubsTable initial={clubs} genres={genreOptions} />
      </TabsContent>
      <TabsContent>
        <AdminClubModerationDrawer posts={recentPosts} articles={recentArticles} />
      </TabsContent>
      <TabsContent>
        <AdminMusicMediaList initial={recentMedia} />
      </TabsContent>
      <TabsContent>
        <AdminGenresList initial={genres} />
      </TabsContent>
      <TabsContent>
        <AdminMusicStats stats={stats} error={statsError} />
      </TabsContent>
    </Tabs>
  );
}
