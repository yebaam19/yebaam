'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Club } from '@/features/clubs/types/club.types';
import type {
  ClubPost,
  ClubBadge,
  ClubMemberLite,
  ClubEventLite,
  ClubPromotionLite,
  ClubForoBoard,
} from '@/features/clubs/server/clubs.server';
import {
  joinClubAction,
  leaveClubAction,
} from '@/features/clubs/server/clubs.actions';
import { ClubHeader } from './ClubHeader';
import { ClubTabs, type TabType } from './ClubTabs';
import { ClubHighlightedPosts } from './ClubHighlightedPosts';
import { ClubDrawer } from './ClubDrawer';
import { ClubTabContent } from './ClubTabContent';
import type { ViewMode } from './ClubPostsGrid';
import {
  MembersPanel,
  EventsPanel,
  PromotionsPanel,
  ForoPanel,
  PublicChatPanel,
} from './ClubPanels';
import {
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ChatBubbleBottomCenterTextIcon,
  CalendarDaysIcon,
  TagIcon,
  Squares2X2Icon,
  Bars3Icon,
  PaperAirplaneIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
} from '@/components/icons/heroicons-shim';
import { formatDate, formatMembersCount } from '@/features/clubs/utils/clubHelpers';

type DrawerKey = 'chat' | 'members' | 'foro' | 'events' | 'promotions' | null;

interface ClubDetailViewProps {
  club: Club;
  initialPosts: ClubPost[];
  highlights: {
    mostRecent: ClubPost | null;
    mostViewed: ClubPost | null;
    mostReacted: ClubPost | null;
  };
  badges: ClubBadge[];
  members: ClubMemberLite[];
  events: ClubEventLite[];
  promotions: ClubPromotionLite[];
  publicChatId: string | null;
  foroSpaceSlug: string | null;
  foroBoard: ClubForoBoard;
}

const NAV_ITEMS: { key: Exclude<DrawerKey, null>; label: string; icon: typeof UsersIcon }[] = [
  { key: 'chat', label: 'Chat Público', icon: ChatBubbleLeftRightIcon },
  { key: 'members', label: 'Miembros', icon: UsersIcon },
  { key: 'foro', label: 'Foro', icon: ChatBubbleBottomCenterTextIcon },
  { key: 'events', label: 'Eventos', icon: CalendarDaysIcon },
  { key: 'promotions', label: 'Promociones', icon: TagIcon },
];

export function ClubDetailView({
  club,
  initialPosts,
  highlights,
  badges,
  members,
  events,
  promotions,
  publicChatId,
  foroSpaceSlug,
  foroBoard,
}: ClubDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('acerca');
  const [drawer, setDrawer] = useState<DrawerKey>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cascade');
  const [pending, startTransition] = useTransition();

  const handleMembership = () => {
    startTransition(async () => {
      const res = club.isMember
        ? await leaveClubAction(club.id)
        : await joinClubAction(club.id);
      if (res.ok) router.refresh();
      else alert(res.error);
    });
  };

  const handleInvite = () => {
    setDrawer('members');
  };

  const handleMessage = () => {
    if (publicChatId) router.push(`/chat/${publicChatId}`);
    else setDrawer('chat');
  };

  const openPost = (id: string) => {
    console.info('open post', id);
  };

  const drawerTitles: Record<Exclude<DrawerKey, null>, string> = {
    chat: 'Chat Público',
    members: 'Miembros',
    foro: 'Foro',
    events: 'Eventos',
    promotions: 'Promociones',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ClubHeader
        club={club}
        isMember={club.isMember}
        isLoading={pending}
        onMembershipToggle={handleMembership}
        onInvite={handleInvite}
        onMessage={handleMessage}
      />

      {/* Badge strip */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Badges
          </span>
          {badges.length === 0 ? (
            <span className="text-xs text-gray-400">Sin badges</span>
          ) : (
            badges.map((b) => (
              <span
                key={b.id}
                title={b.description ?? undefined}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
              >
                <CheckBadgeIcon className="h-3.5 w-3.5" />
                {b.label}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Top tabs */}
      <ClubTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main body: left nav | main | right rail */}
      <div className="mx-auto flex max-w-7xl gap-4 px-2 py-4 md:px-4">
        {/* Left nav */}
        <nav className="hidden w-44 shrink-0 lg:block">
          <ul className="sticky top-4 space-y-2">
            {NAV_ITEMS.map((n) => {
              const Icon = n.icon;
              return (
                <li key={n.key}>
                  <button
                    onClick={() => setDrawer(n.key)}
                    className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-primary-400 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-primary-500 dark:hover:text-primary-300"
                  >
                    <Icon className="h-4 w-4" />
                    {n.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile nav — horizontal scroll */}
        <div className="lg:hidden" />

        {/* Main column */}
        <main className="min-w-0 flex-1 space-y-4">
          {/* DETALLES card */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Detalles
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Miembros</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatMembersCount(club.stats.membersCount)}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Eventos</div>
                <div className="font-semibold text-gray-900 dark:text-white">{events.length}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Publicaciones</div>
                <div className="font-semibold text-gray-900 dark:text-white">{initialPosts.length}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Creado</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(new Date(club.createdAt))}
                </div>
              </div>
            </div>
            {(club.location || club.website) && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                {club.location && (
                  <span className="inline-flex items-center gap-1">
                    <GlobeAltIcon className="h-3.5 w-3.5" />
                    {club.location}
                  </span>
                )}
                {club.website && (
                  <a
                    href={club.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    {club.website}
                  </a>
                )}
              </div>
            )}
          </section>

          {/* Highlights row */}
          <ClubHighlightedPosts highlights={highlights} onOpen={openPost} />

          {/* Tab content */}
          <ClubTabContent
            club={club}
            posts={initialPosts}
            activeTab={activeTab}
            viewMode={viewMode}
            onOpenPost={openPost}
          />
        </main>

        {/* Right rail */}
        <aside className="hidden w-36 shrink-0 md:block">
          <div className="sticky top-4 space-y-3">
            <button
              onClick={handleMessage}
              className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-primary-400 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-primary-500"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              Messenger
            </button>
            <div className="rounded-lg border border-gray-200 bg-white p-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <div className="mb-1 font-semibold text-gray-900 dark:text-white">Modo de vista</div>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('cascade')}
                  className={`flex-1 rounded px-2 py-1 text-xs ${
                    viewMode === 'cascade'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  title="Cascada"
                >
                  <Bars3Icon className="mx-auto h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('paginated')}
                  className={`flex-1 rounded px-2 py-1 text-xs ${
                    viewMode === 'paginated'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  title="12 por página"
                >
                  <Squares2X2Icon className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile left-nav as bottom sheet trigger list */}
      <nav className="flex gap-2 overflow-x-auto border-t border-gray-200 bg-white px-3 py-2 lg:hidden dark:border-gray-700 dark:bg-gray-800">
        {NAV_ITEMS.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.key}
              onClick={() => setDrawer(n.key)}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200"
            >
              <Icon className="h-3.5 w-3.5" />
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* Drawer */}
      <ClubDrawer
        open={drawer !== null}
        title={drawer ? drawerTitles[drawer] : ''}
        onClose={() => setDrawer(null)}
      >
        {drawer === 'members' && <MembersPanel members={members} />}
        {drawer === 'events' && <EventsPanel events={events} />}
        {drawer === 'promotions' && <PromotionsPanel promotions={promotions} />}
        {drawer === 'foro' && (
          <ForoPanel foroSpaceSlug={foroSpaceSlug} foroBoard={foroBoard} />
        )}
        {drawer === 'chat' && <PublicChatPanel publicChatId={publicChatId} />}
      </ClubDrawer>
    </div>
  );
}
