'use client';

import { FC, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Route } from 'next';
import type { Page } from '../../../types/page.types';
import {
  getPageTabs,
  COMING_SOON_COPY,
  type PageTabId,
} from '../../../config/page-tabs';
import {
  getPageSideMenu,
  SIDE_SECTION_COMING_SOON,
  type PageSideSectionId,
} from '../../../config/page-side-menu';
import { PageCover } from './PageCover';
import { PageProfilePhoto } from './PageProfilePhoto';
import { PageDetailsCard } from './PageDetailsCard';
import { PageSideMenu } from './PageSideMenu';
import { PageBadgesStrip } from './PageBadgesStrip';
import { PageSectionChips } from './PageSectionChips';
import { PageFeatured } from './PageFeatured';
import { PageContactPanel } from './PageContactPanel';
import {
  PageAskMePanel,
  PageAuditionsPanel,
  PageEventsPanel,
  PageRelatedPanel,
  PageExternalModulePanel,
} from './PageSidePanels';
import { PageDetailAbout } from '../PageDetailAbout';
import { PageDetailPosts } from '../PageDetailPosts';
import { PageDetailTeam } from '../PageDetailTeam';
import { PageDetailVideos } from '../PageDetailVideos';
import { PageDetailArtists } from '../PageDetailArtists';
import { PageDetailArticles } from '../PageDetailArticles';
import { PageComingSoon } from '../PageComingSoon';
import { PageDetailPhotos } from '../../photos/PageDetailPhotos';
import { PageDetailCommunity } from '../../community/PageDetailCommunity';
import { readPageQuery, replacePageQuery } from '../../../utils/pageUrlState';

/** Arrastra socket.io: sólo se monta cuando el propietario abre "Mensajes". */
const PageMessagesTest = dynamic(
  () => import('../../messages/PageMessagesTest').then((m) => m.PageMessagesTest),
  { ssr: false }
);

interface PageArtistShellProps {
  page: Page;
  isOwner: boolean;
  unreadCount: number;
}

/**
 * Layout del wireframe (PÁGINA-DE-SIN-LIBRETO.pdf, pág. 13):
 *
 *   ┌───────────── PORTADA + botones §1.3 ─────────────┐
 *   │ rail §7 │ foto + Detalles §3 │ badges §2         │
 *   │         │                    │ fichas §4         │
 *   │         │                    │ destacado §5      │
 *   │         │                    │ muro §6           │
 *
 * Las tres columnas sólo existen a partir de `xl`; el área de contenido de la
 * app ya gasta ancho en su propio shell (sidebar global + panel derecho), y a
 * `lg` tres columnas dejaban la principal tan estrecha que la descripción se
 * rompía a una palabra por línea. Por debajo de `xl` el rail y la identidad se
 * apilan a la izquierda; por debajo de `lg`, todo en una columna.
 */
export const PageArtistShell: FC<PageArtistShellProps> = ({ page, isOwner, unreadCount }) => {
  const tabs = getPageTabs(page.category);
  const sideItems = getPageSideMenu(page.category);
  const isOwnerOrAdmin = isOwner || page.userRole === 'admin';
  // El backend autoriza OWNER/ADMIN/EDITOR para gestionar contenido
  // (canManagePage); `userRole` llega en minúsculas desde mapPage. Sin el
  // editor aquí, su UI quedaba muda aunque el servidor sí lo aceptara.
  const canManageContent =
    isOwner || ['owner', 'admin', 'editor'].includes(page.userRole ?? '');

  // `?tab=` / `?seccion=` se validan contra lo que esta página ofrece de verdad:
  // un enlace viejo a una ficha de otra categoría —o a una sección aún sin
  // backend— cae a la vista por defecto en vez de abrir un panel vacío.
  const [activeTab, setActiveTab] = useState<PageTabId | null>(() => {
    const raw = readPageQuery('tab') as PageTabId | null;
    return raw && tabs.includes(raw) ? raw : null;
  });
  const [sideSection, setSideSection] = useState<PageSideSectionId | null>(() => {
    const raw = readPageQuery('seccion') as PageSideSectionId | null;
    const item = sideItems.find((i) => i.id === raw);
    if (!item || !item.available) return null;
    if (item.ownerOnly && !isOwner) return null;
    return item.id;
  });

  const handleTabChange = useCallback((tab: PageTabId | null) => {
    setActiveTab(tab);
    setSideSection(null);
    replacePageQuery({ tab, seccion: null });
  }, []);

  const handleSideChange = useCallback((section: PageSideSectionId) => {
    setSideSection(section);
    setActiveTab(null);
    replacePageQuery({ seccion: section, tab: null });
  }, []);

  const tabComingSoon = activeTab ? COMING_SOON_COPY[activeTab] : undefined;
  const sideComingSoon = sideSection ? SIDE_SECTION_COMING_SOON[sideSection] : undefined;
  const showDefaultWall = !activeTab && !sideSection;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <PageCover page={page} isOwnerOrAdmin={isOwnerOrAdmin} unreadCount={unreadCount} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Rail (§7) + identidad (foto y Detalles §3).
              Comparten columna hasta `2xl` a propósito: el área de contenido de
              la app mide ~690 px a 1280 px de viewport —el shell global ya gasta
              el resto en sus dos barras—, y partirla en tres dejaba el rail en
              ~110 px, con "Miembros y Seguidores" encima de su propia píldora.
              Las tres columnas del wireframe sólo caben cuando el viewport da
              de sí (2xl); por debajo, rail e identidad se apilan a la izquierda. */}
          <aside className="lg:col-span-4 2xl:col-span-5">
            <div className="grid gap-4 2xl:grid-cols-5 2xl:sticky 2xl:top-20">
              <div className="order-2 2xl:order-1 2xl:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
                  <PageSideMenu
                    items={sideItems}
                    activeSection={sideSection}
                    onSectionChange={handleSideChange}
                    isOwner={isOwner}
                    counts={{ miembros: page.followerCount }}
                  />
                </div>
              </div>

              <div className="order-1 2xl:order-2 2xl:col-span-3 space-y-4">
                <PageProfilePhoto page={page} isOwnerOrAdmin={isOwnerOrAdmin} />
                <PageDetailsCard page={page} />
              </div>
            </div>
          </aside>

          {/* Columna principal */}
          <main className="lg:col-span-8 2xl:col-span-7 space-y-4">
            <PageBadgesStrip pageId={page.id} isOwner={isOwner} />

            <PageSectionChips tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

            {showDefaultWall && (
              <>
                <PageFeatured page={page} isOwner={isOwner} />
                <PageDetailPosts pageId={page.id} isOwner={isOwner} />
              </>
            )}

            {/* Fichas §4 */}
            {activeTab === 'acerca-de' && <PageDetailAbout page={page} />}
            {activeTab === 'equipo' && <PageDetailTeam page={page} />}
            {activeTab === 'videos' && (
              <PageDetailVideos pageId={page.id} isOwner={canManageContent} />
            )}
            {activeTab === 'fotos' && <PageDetailPhotos pageId={page.id} />}
            {activeTab === 'artistas' && (
              <PageDetailArtists page={page} isOwner={canManageContent} />
            )}
            {activeTab === 'articulos' && (
              <PageDetailArticles page={page} isOwner={canManageContent} />
            )}
            {tabComingSoon && (
              <PageComingSoon
                title={tabComingSoon.title}
                description={tabComingSoon.description}
              />
            )}

            {/* Secciones §7 */}
            {sideSection === 'miembros' && <PageDetailCommunity pageId={page.id} />}
            {sideSection === 'contacto' && <PageContactPanel page={page} />}
            {sideSection === 'askme' && (
              <PageAskMePanel page={page} isOwner={isOwnerOrAdmin} />
            )}
            {sideSection === 'audiciones' && (
              <PageAuditionsPanel page={page} isOwner={isOwnerOrAdmin} />
            )}
            {sideSection === 'eventos' && (
              <PageEventsPanel page={page} isOwner={isOwnerOrAdmin} />
            )}
            {sideSection === 'relacionadas' && <PageRelatedPanel pageId={page.id} />}
            {/* pages.chat_publico_room_id / foro_space_id: si la página tiene
                sala/espacio propios, el panel enlaza directo (rutas por slug,
                resuelto en el backend); si no, cae al módulo genérico. */}
            {sideSection === 'chat-publico' && (
              <PageExternalModulePanel
                title="Chat Público"
                description={
                  page.chatPublicoRoomSlug
                    ? 'Conversaciones abiertas de la comunidad. Esta página tiene su propia sala en el Chat Público de YEBAAM — entra directo desde aquí.'
                    : 'Conversaciones abiertas de la comunidad. Entra a la sala pública de YEBAAM; la sala dedicada de esta página se enlazará aquí cuando el equipo la active.'
                }
                href={
                  (page.chatPublicoRoomSlug
                    ? `/feed/chat-publico/${page.chatPublicoRoomSlug}`
                    : '/feed/chat-publico') as Route
                }
                cta="Abrir Chat Público"
              />
            )}
            {sideSection === 'foro' && (
              <PageExternalModulePanel
                title="Foro"
                description={
                  page.foroSpaceSlug
                    ? 'Discusiones por tema. Esta página tiene su propio espacio en el Foro de YEBAAM — entra directo desde aquí.'
                    : 'Discusiones por tema. Explora los foros de la plataforma; el espacio propio de esta página se vincula desde administración cuando esté habilitado.'
                }
                href={(page.foroSpaceSlug ? `/foro/${page.foroSpaceSlug}` : '/foro') as Route}
                cta={page.foroSpaceSlug ? 'Ir al Foro de la página' : 'Ir al Foro'}
              />
            )}
            {sideSection === 'mensajes' && isOwner && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Mensajes
                </h2>
                <PageMessagesTest pageId={page.id} />
              </div>
            )}
            {sideComingSoon && (
              <PageComingSoon
                title={sideComingSoon.title}
                description={sideComingSoon.description}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
