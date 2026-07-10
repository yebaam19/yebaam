'use client';

import { FC, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Page } from '../../../types/page.types';
import { getPageTabs, COMING_SOON_COPY, type PageTabId } from '../../../config/page-tabs';
import { PageDetailHeader } from '../PageDetailHeader';
import { PageDetailTabs } from '../PageDetailTabs';
import { PageDetailSidebar } from '../PageDetailSidebar';
import { PageDetailAbout } from '../PageDetailAbout';
import { PageDetailPosts } from '../PageDetailPosts';
import { PageDetailReels } from '../PageDetailReels';
import { PageDetailFAQ } from '../PageDetailFAQ';
import { PageDetailBadges } from '../PageDetailBadges';
import { PageDetailProducts } from '../PageDetailProducts';
import { PageComingSoon } from '../PageComingSoon';
import { PageDetailPhotos } from '../../photos/PageDetailPhotos';
import { PageDetailCommunity } from '../../community/PageDetailCommunity';
import { PageDetailReviews } from '../../reviews/PageDetailReviews';
import { PageDetailPromotions } from '../../promotions/PageDetailPromotions';
import { readPageQuery, replacePageQuery } from '../../../utils/pageUrlState';

const PageMessagesTest = dynamic(
  () => import('../../messages/PageMessagesTest').then((m) => m.PageMessagesTest),
  { ssr: false }
);

type SidebarSection =
  | 'fotos'
  | 'comunidad'
  | 'valoraciones'
  | 'preguntas'
  | 'promociones'
  | 'productos'
  | 'insignias'
  | 'mensajes';

interface PageBusinessShellProps {
  page: Page;
  isOwner: boolean;
}

/**
 * Layout histórico de las páginas de negocio: portada con avatar superpuesto,
 * barra de pestañas horizontal y un único rail a la derecha. Se conserva intacto
 * — el wireframe del PDF describe la página de artista/comunidad (Sin Libreto),
 * no ésta, y un negocio necesita Promociones/Productos/Valoraciones.
 */
export const PageBusinessShell: FC<PageBusinessShellProps> = ({ page, isOwner }) => {
  const [activeTab, setActiveTab] = useState<PageTabId>(
    () => (readPageQuery('tab') as PageTabId | null) ?? 'inicio'
  );
  const [sidebarSection, setSidebarSection] = useState<SidebarSection | null>(null);

  const tabs = getPageTabs(page.category);
  const activeTabId: PageTabId = tabs.includes(activeTab) ? activeTab : 'inicio';
  const comingSoon = COMING_SOON_COPY[activeTabId];

  const handleTabChange = useCallback((tab: PageTabId) => {
    setActiveTab(tab);
    setSidebarSection(null);
    replacePageQuery({ tab });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageDetailHeader page={page} />
      <PageDetailTabs tabs={tabs} activeTab={activeTabId} onTabChange={handleTabChange} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {!sidebarSection && (
              <>
                {activeTabId === 'inicio' && (
                  <PageDetailPosts pageId={page.id} isOwner={isOwner} />
                )}
                {activeTabId === 'publicaciones' && (
                  <PageDetailPosts pageId={page.id} isOwner={isOwner} />
                )}
                {activeTabId === 'reels' && (
                  <PageDetailReels pageId={page.id} isOwner={isOwner} />
                )}
                {activeTabId === 'acerca-de' && <PageDetailAbout page={page} />}
                {comingSoon && (
                  <PageComingSoon
                    title={comingSoon.title}
                    description={comingSoon.description}
                  />
                )}
              </>
            )}

            {sidebarSection === 'fotos' && <PageDetailPhotos pageId={page.id} />}
            {sidebarSection === 'comunidad' && <PageDetailCommunity pageId={page.id} />}
            {sidebarSection === 'valoraciones' && <PageDetailReviews pageId={page.id} />}
            {sidebarSection === 'preguntas' && <PageDetailFAQ pageId={page.id} />}
            {sidebarSection === 'promociones' && (
              <PageDetailPromotions pageId={page.id} isOwner={isOwner} />
            )}
            {sidebarSection === 'productos' && (
              <PageDetailProducts pageId={page.id} pageSlug={page.slug} isOwner={isOwner} />
            )}
            {sidebarSection === 'insignias' && <PageDetailBadges pageId={page.id} />}
            {sidebarSection === 'mensajes' && isOwner && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Mensajes de Clientes
                </h2>
                <PageMessagesTest pageId={page.id} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20">
              {activeTabId === 'inicio' && !sidebarSection && (
                <div className="mb-6">
                  <PageDetailAbout page={page} />
                </div>
              )}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <PageDetailSidebar
                  pageId={page.id}
                  pageSlug={page.slug}
                  activeSection={sidebarSection || undefined}
                  onSectionChange={setSidebarSection}
                  isOwner={isOwner}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
