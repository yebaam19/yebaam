'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { AdminAlbumUploadForm } from './AdminAlbumUploadForm';
import { MusicImporterPanel } from './MusicImporterPanel';
import { AdminAlbumsList } from './admin/AdminAlbumsList';
import { AdminArtistsList } from './admin/AdminArtistsList';
import { AdminLabelsList } from './admin/AdminLabelsList';

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

interface Props {
  recentImports: RecentImport[];
  recentError: string | null;
  initialAlbums: AlbumRow[];
  initialArtists: ArtistRow[];
  initialLabels: LabelRow[];
}

export function AdminMusicTabs({
  recentImports,
  recentError,
  initialAlbums,
  initialArtists,
  initialLabels,
}: Props) {
  return (
    <Tabs>
      <TabsList>
        <TabsTrigger>Subir disco</TabsTrigger>
        <TabsTrigger>Pegar enlace</TabsTrigger>
        <TabsTrigger>Discos</TabsTrigger>
        <TabsTrigger>Artistas</TabsTrigger>
        <TabsTrigger>Sellos</TabsTrigger>
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
    </Tabs>
  );
}
