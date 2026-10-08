import 'server-only';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { getCommunityBySlug, getCommunityPosts } from '../../server/communities.server';
import { getCommunityProfileCapabilities } from '../../server/community-plan.server';
import { getAssetFolder, getAssetFolders, getLibraryAssets } from '../../server/community-library.server';
import type { AssetKind } from '../../types/communityLibrary.types';
import { CommunityTopTabs } from '../CommunityTopTabs';
import { CommunityPhotosPanel } from '../CommunityPhotosPanel';
import { CommunityVideosPanel } from '../CommunityVideosPanel';
import { LibraryWorkspace } from './LibraryWorkspace';

export async function CommunityLibraryPage({ slug, kind, searchParams, pdfOnly = false }: {
  slug: string; kind: AssetKind; searchParams: { q?: string; carpeta?: string }; pdfOnly?: boolean;
}) {
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();
  const search = typeof searchParams.q === 'string' ? searchParams.q.trim().slice(0, 100) : '';
  const folderId = searchParams.carpeta === 'none' ? null : z.uuid().safeParse(searchParams.carpeta).success ? searchParams.carpeta : undefined;
  const [initial, folders, capabilities, t, selectedFolder] = await Promise.all([
    getLibraryAssets(community.id, kind, folderId, search, null, pdfOnly), getAssetFolders(community.id, kind),
    getCommunityProfileCapabilities(community.id), getTranslations('communities.library'),
    folderId ? getAssetFolder(community.id, folderId, kind) : null,
  ]);
  if (folderId && !selectedFolder) notFound();
  const initialFolders = selectedFolder && !folders.items.some((folder) => folder.id === selectedFolder.id)
    ? { ...folders, items: [selectedFolder, ...folders.items] } : folders;
  const path = pdfOnly ? 'pdf' : kind === 'image' ? 'fotos' : kind === 'video' ? 'videos' : 'archivos';
  const legacy = kind !== 'document' ? await getCommunityPosts(community.id, { page: 1, limit: 50 }) : null;
  return <div className="space-y-5">
    <CommunityTopTabs slug={slug} />
    <LibraryWorkspace key={crypto.randomUUID()} communityId={community.id} kind={kind} initial={initial} folders={initialFolders}
      canEdit={capabilities.content} basePath={`/feed/comunidades/${slug}/${path}`} search={search} folderId={folderId} pdfOnly={pdfOnly} />
    {legacy && <details className="rounded-xl bg-white p-4 dark:bg-neutral-800">
      <summary className="min-h-11 cursor-pointer text-sm font-medium text-neutral-700 focus-visible:outline-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300 dark:text-neutral-200">{t('fromPosts')}</summary>
      <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-300">{t('fromPostsHint')}</p>
      {kind === 'image' ? <CommunityPhotosPanel posts={legacy.posts} /> : <CommunityVideosPanel posts={legacy.posts} />}
    </details>}
  </div>;
}
