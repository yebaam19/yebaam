'use client';

import { useParams } from 'next/navigation';
import { pagesService } from '@/features/pages/services/pages.service';
import { usePageBySlug } from '@/features/pages/hooks/usePages';
import {
  PageDetailHeader,
  PageDetailTabs,
  PageDetailSidebar,
  PageDetailAbout,
  PageDetailPosts,
  PageDetailPhotos,
  PageDetailCommunity,
  PageDetailReviews,
  PageDetailFAQ,
  PageDetailPromotions,
  PageDetailProducts,
  PageDetailBadges,
  PageDetailReels,
} from '@/features/pages/components/detail';
import { PageMessagesButton } from '@/features/pages/components/messages';
import { PageMessagesTest } from '@/features/pages/components/messages';
import { usePageConversations } from '@/features/pages/hooks/usePageMessages';
import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';

type TabType = 'inicio' | 'publicaciones' | 'reels' | 'acerca-de';

type SidebarSection =
  | 'fotos'
  | 'comunidad'
  | 'valoraciones'
  | 'preguntas'
  | 'promociones'
  | 'productos'
  | 'insignias'
  | 'mensajes';

export default function PageDetailPage() {
  const params = useParams();
  const pageSlug = params.slug as string;
  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [sidebarSection, setSidebarSection] = useState<SidebarSection | null>(null);
  const currentUser = useAuthStore((state) => state.user);

  // Fetch page data from API using slug with the custom hook
  const { data: pageResponse, isLoading, error } = usePageBySlug(pageSlug);

  const page = pageResponse?.page;

  // Determinar si el usuario es el owner de la página
  const isOwner = currentUser?.id === page?.ownerId;
  
  // Fetch conversations to calculate unread count (only if user is owner)
  const { data: conversationsData } = usePageConversations(
    isOwner ? page?.id : undefined,
    { page: 1, limit: 50, includeArchived: false }
  );

  // Calculate total unread messages count
  const unreadCount = conversationsData?.conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  ) ?? 0;





  // Reset sidebar when changing main tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSidebarSection(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando página...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Página no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            La página que buscas no existe o ha sido eliminada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with cover and avatar */}
      <PageDetailHeader page={page} />

      {/* Tabs Navigation */}
      <PageDetailTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Content Area with Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Main Tab Content */}
            {!sidebarSection && (
              <>
                {activeTab === 'inicio' && (
                  <div className="space-y-6">
                    <PageDetailPosts pageId={page.id} isOwner={isOwner} />
                  </div>
                )}

                {activeTab === 'publicaciones' && (
                  <PageDetailPosts pageId={page.id} isOwner={isOwner} />
                )}

                {activeTab === 'reels' && (
                  <PageDetailReels pageId={page.id} isOwner={isOwner} />
                )}

                {activeTab === 'acerca-de' && (
                  <PageDetailAbout page={page} />
                )}
              </>
            )}

            {/* Sidebar Section Content */}
            {sidebarSection === 'fotos' && (
              <PageDetailPhotos pageId={page.id} isOwner={isOwner} />
            )}

            {sidebarSection === 'comunidad' && (
              <PageDetailCommunity pageId={page.id} />
            )}

            {sidebarSection === 'valoraciones' && (
              <PageDetailReviews pageId={page.id} />
            )}

            {sidebarSection === 'preguntas' && (
              <PageDetailFAQ pageId={page.id} />
            )}

            {sidebarSection === 'promociones' && (
              <PageDetailPromotions pageId={page.id} isOwner={isOwner} />
            )}

            {sidebarSection === 'productos' && (
              <PageDetailProducts pageId={page.id} pageSlug={page.slug} isOwner={isOwner} />
            )}

            {sidebarSection === 'insignias' && (
              <PageDetailBadges pageId={page.id} />
            )}

            {sidebarSection === 'mensajes' && isOwner && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Mensajes de Clientes
                </h2>
                <PageMessagesTest pageId={page.id} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              {/* About Card (only in inicio tab) */}
              {activeTab === 'inicio' && !sidebarSection && (
                <div className="mb-6">
                  <PageDetailAbout page={page} />
                </div>
              )}

              {/* Sidebar Navigation */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <PageDetailSidebar
                  pageId={page.id}
                  pageSlug={pageSlug}
                  activeSection={sidebarSection || undefined}
                  onSectionChange={setSidebarSection}
                  isOwner={isOwner}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Messages Button - Only visible for page owner */}
      {isOwner && (
        <PageMessagesButton pageId={page.id} unreadCount={unreadCount} />
      )}
    </div>
  );
}
