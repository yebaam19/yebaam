'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { AdminAlbumUploadForm } from './AdminAlbumUploadForm';
import { MusicImporterPanel } from './MusicImporterPanel';

interface RecentImport {
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

export function AdminMusicTabs({ recentImports, recentError }: Props) {
  return (
    <Tabs>
      <TabsList>
        <TabsTrigger>Subir disco</TabsTrigger>
        <TabsTrigger>Pegar enlace</TabsTrigger>
      </TabsList>
      <TabsContent>
        <AdminAlbumUploadForm />
      </TabsContent>
      <TabsContent>
        <MusicImporterPanel
          recentImports={recentImports}
          recentError={recentError}
        />
      </TabsContent>
    </Tabs>
  );
}
