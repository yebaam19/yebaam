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
  CheckBadgeIcon,
  GlobeAltIcon,
} from '@/components/icons/heroicons-shim';
import { formatDate, formatDateShort, formatMembersCount } from '@/features/clubs/utils/clubHelpers';

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

      {/* Badge strip — only when there are badges */}
      {badges.length > 0 && (
        <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Badges
            </span>
            {badges.map((b) => (
              <span
                key={b.id}
                title={b.description ?? undefined}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
              >
                <CheckBadgeIcon className="h-3.5 w-3.5" />
                {b.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top tabs */}
      <ClubTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Mobile section nav — horizontal scroll above main */}
      <nav className="flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2 lg:hidden dark:border-gray-700 dark:bg-gray-800">
        {NAV_ITEMS.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.key}
              onClick={() => setDrawer(n.key)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-primary-400 hover:text-primary-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-primary-500"
            >
              <Icon className="h-3.5 w-3.5" />
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* Main body: left nav | main */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* Left nav (desktop) */}
        <nav className="hidden lg:block">
          <ul className="sticky top-4 space-y-1.5">
            {NAV_ITEMS.map((n) => {
              const Icon = n.icon;
              return (
                <li key={n.key}>
                  <button
                    onClick={() => setDrawer(n.key)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary-400 hover:bg-primary-50/40 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-primary-500 dark:hover:bg-primary-900/20 dark:hover:text-primary-300"
                  >
                    <Icon className="h-4 w-4" />
                    {n.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Main column */}
        <main className="min-w-0 space-y-4">
          {/* DETALLES card */}
          <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Detalles
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
              <div className="min-w-0">
                <dt className="truncate text-xs text-gray-500 dark:text-gray-400">Miembros</dt>
                <dd className="mt-0.5 truncate font-semibold tabular-nums text-gray-900 dark:text-white">
                  {formatMembersCount(club.stats.membersCount)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="truncate text-xs text-gray-500 dark:text-gray-400">Eventos</dt>
                <dd className="mt-0.5 truncate font-semibold tabular-nums text-gray-900 dark:text-white">
                  {events.length}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="truncate text-xs text-gray-500 dark:text-gray-400">Publicaciones</dt>
                <dd className="mt-0.5 truncate font-semibold tabular-nums text-gray-900 dark:text-white">
                  {initialPosts.length}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="truncate text-xs text-gray-500 dark:text-gray-400">Creado</dt>
                <dd
                  className="mt-0.5 truncate font-semibold text-gray-900 dark:text-white"
                  title={formatDate(new Date(club.createdAt))}
                >
                  {formatDateShort(new Date(club.createdAt))}
                </dd>
              </div>
            </dl>
            {(club.location || club.website) && (
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
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

          {/* View-mode toggle (only in non-acerca tabs) */}
          {activeTab !== 'acerca' && (
            <div className="flex justify-end">
              <div
                role="group"
                aria-label="Modo de vista"
                className="inline-flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('cascade')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    viewMode === 'cascade'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  title="Cascada"
                  aria-pressed={viewMode === 'cascade'}
                >
                  <Bars3Icon className="h-3.5 w-3.5" />
                  Cascada
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('paginated')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    viewMode === 'paginated'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  title="Paginado"
                  aria-pressed={viewMode === 'paginated'}
                >
                  <Squares2X2Icon className="h-3.5 w-3.5" />
                  Paginado
                </button>
              </div>
            </div>
          )}

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
      </div>

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
