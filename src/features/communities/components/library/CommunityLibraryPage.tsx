import 'server-only';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { Route } from 'next';
import { z } from 'zod';
import { getCommunityBySlug, getCommunityLegacyPosts } from '../../server/communities.server';
import { getCommunityProfileCapabilities } from '../../server/community-plan.server';
import { getCommunityTopTabs } from '../../server/community-top-tabs.server';
import { getAssetFolder, getAssetFolders, getLibraryAssets } from '../../server/community-library.server';
import type { AssetKind } from '../../types/communityLibrary.types';
import { parseCommunityPostCursor } from '../../schemas/communityPostCursor.schema';
import type { CommunityPostCursor } from '../../schemas/communityPostCursor.schema';
import { CommunityTopTabs } from '../CommunityTopTabs';
import { CommunityPhotosPanel } from '../CommunityPhotosPanel';
import { CommunityVideosPanel } from '../CommunityVideosPanel';
import { LibraryWorkspace } from './LibraryWorkspace';

export async function CommunityLibraryPage({ slug, kind, searchParams, pdfOnly = false }: {
  slug: string; kind: AssetKind; searchParams: { q?: string; carpeta?: string; legacyCursor?: string; legacyPage?: string }; pdfOnly?: boolean;
}) {
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();
  const search = typeof searchParams.q === 'string' ? searchParams.q.trim().slice(0, 100) : '';
  const folderId = searchParams.carpeta === 'none' ? null : z.uuid().safeParse(searchParams.carpeta).success ? searchParams.carpeta : undefined;
  const legacyCursor = parseCommunityPostCursor(searchParams.legacyCursor);
  const loadLegacy = kind !== 'document' && (legacyCursor !== null || searchParams.legacyPage === 'recent');
  const [initial, folders, capabilities, t, selectedFolder, topTabs, legacy] = await Promise.all([
    getLibraryAssets(community.id, kind, folderId, search, null, pdfOnly), getAssetFolders(community.id, kind),
    getCommunityProfileCapabilities(community.id), getTranslations('communities.library'),
    folderId ? getAssetFolder(community.id, folderId, kind) : null,
    getCommunityTopTabs(community.id),
    loadLegacy ? getCommunityLegacyPosts(community.id, legacyCursor, slug) : null,
  ]);
  if (folderId && !selectedFolder) notFound();
  const initialFolders = selectedFolder && !folders.items.some((folder) => folder.id === selectedFolder.id)
    ? { ...folders, items: [selectedFolder, ...folders.items] } : folders;
  const path = pdfOnly ? 'pdf' : kind === 'image' ? 'fotos' : kind === 'video' ? 'videos' : 'archivos';
  const workspaceKey = JSON.stringify([community.id, kind, pdfOnly, folderId === undefined ? 'all' : folderId ?? 'none', search]);
  function legacyHref(cursor: CommunityPostCursor | null): Route {
    const query = new URLSearchParams();
    if (search) query.set('q', search);
    if (folderId === null) query.set('carpeta', 'none');
    else if (folderId) query.set('carpeta', folderId);
    if (cursor) query.set('legacyCursor', JSON.stringify(cursor));
    else query.set('legacyPage', 'recent');
    return `/feed/comunidades/${slug}/${path}${query.size ? `?${query}` : ''}#compartidos-publicaciones` as Route;
  }
  return <div className="space-y-5">
    <CommunityTopTabs slug={slug} config={topTabs} canManage={capabilities.settings} />
    <LibraryWorkspace key={workspaceKey} communityId={community.id} kind={kind} initial={initial} folders={initialFolders}
      canEdit={capabilities.content} basePath={`/feed/comunidades/${slug}/${path}`} search={search} folderId={folderId} pdfOnly={pdfOnly} />
    {kind !== 'document' && !legacy && <section id="compartidos-publicaciones" className="scroll-mt-6 rounded-xl bg-white p-4 dark:bg-neutral-800">
      <Link href={legacyHref(null)} prefetch={false}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-primary-300">
        {t('fromPosts')}
      </Link>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('fromPostsHint')}</p>
    </section>}
    {legacy && <details id="compartidos-publicaciones" open className="scroll-mt-6 rounded-xl bg-white p-4 dark:bg-neutral-800">
      <summary className="min-h-11 cursor-pointer text-sm font-medium text-neutral-700 focus-visible:outline-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300 dark:text-neutral-200">{t('fromPosts')}</summary>
      <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-300">{t('fromPostsHint')}</p>
      {kind === 'image' ? <CommunityPhotosPanel posts={legacy.posts} /> : <CommunityVideosPanel posts={legacy.posts} />}
      {(legacyCursor || legacy.nextCursor) && <nav aria-label={t('postPages')} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
        {legacyCursor ? <Link href={legacyHref(null)} className="text-sm font-medium text-primary-800 hover:underline focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-primary-300">{t('latestPosts')}</Link> : <span />}
        {legacy.nextCursor && <Link href={legacyHref(legacy.nextCursor)} className="inline-flex min-h-10 items-center rounded-lg border border-primary-800 px-4 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-primary-800 dark:border-primary-300 dark:text-primary-300 dark:hover:bg-primary-900/30">{t('olderPosts')}</Link>}
      </nav>}
    </details>}
  </div>;
}
