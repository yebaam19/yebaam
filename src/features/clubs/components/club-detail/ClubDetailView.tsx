'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/lib/utils/date-fns-locale';
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
import { ClubPostComposer } from './ClubPostComposer';
import { ClubPostModal } from './ClubPostModal';
import { ClubAdminPanel } from './ClubAdminPanel';
import { EditClubDetailsModal } from './EditClubDetailsPanel';
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
import { formatMembersCount } from '@/features/clubs/utils/clubHelpers';

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

const NAV_ITEM_DEFS: { key: Exclude<DrawerKey, null>; labelKey: string; icon: typeof UsersIcon }[] = [
  { key: 'chat', labelKey: 'publicChat', icon: ChatBubbleLeftRightIcon },
  { key: 'members', labelKey: 'members', icon: UsersIcon },
  { key: 'foro', labelKey: 'forum', icon: ChatBubbleBottomCenterTextIcon },
  { key: 'events', labelKey: 'events', icon: CalendarDaysIcon },
  { key: 'promotions', labelKey: 'promotions', icon: TagIcon },
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
  const t = useTranslations('clubes');
  const dateLocale = useDateFnsLocale();
  const [activeTab, setActiveTab] = useState<TabType>('acerca');
  const [drawer, setDrawer] = useState<DrawerKey>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cascade');
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const NAV_ITEMS = NAV_ITEM_DEFS.map((n) => ({
    ...n,
    label: t(`detail.sideNav.${n.labelKey}`),
  }));

  const handleMembership = () => {
    startTransition(async () => {
      const res = club.isMember
        ? await leaveClubAction(club.id)
        : await joinClubAction(club.id);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  };

  const canManageMembers =
    club.isOwner ||
    club.currentUserRole === 'OWNER' ||
    club.currentUserRole === 'ADMIN';

  const handleInvite = () => {
    setDrawer('members');
  };

  const handleMessage = () => {
    if (publicChatId) router.push(`/chat/${publicChatId}`);
    else setDrawer('chat');
  };

  const openPost = (id: string) => {
    setOpenPostId(id);
  };

  // Resolve the open post id against every list it could come from: the main
  // feed plus the highlight cards (which can reference posts not in initialPosts).
  const openPost_ = useMemo(() => {
    if (!openPostId) return null;
    const candidates = [
      ...initialPosts,
      highlights.mostRecent,
      highlights.mostViewed,
      highlights.mostReacted,
    ];
    return candidates.find((p): p is ClubPost => !!p && p.id === openPostId) ?? null;
  }, [openPostId, initialPosts, highlights]);

  const drawerTitles: Record<Exclude<DrawerKey, null>, string> = {
    chat: t('detail.sideNav.publicChat'),
    members: t('detail.sideNav.members'),
    foro: t('detail.sideNav.forum'),
    events: t('detail.sideNav.events'),
    promotions: t('detail.sideNav.promotions'),
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
      <nav className="flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2 lg:hidden dark:border-gray-700 dark:bg-gray-800 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
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
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t('detail.detailsHeading')}
              </h2>
              {canManageMembers && (
                <button
                  type="button"
                  onClick={() => setEditDetailsOpen(true)}
                  className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  {t('editDetails.editDetailsButton')}
                </button>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
              <div className="min-w-0">
                <dt className="truncate text-xs text-gray-500 dark:text-gray-400">{t('detail.stats.members')}</dt>
                <dd className="mt-0.5 truncate font-semibold tabular-nums text-gray-900 dark:text-white">
                  {formatMembersCount(club.stats.membersCount)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="truncate text-xs text-gray-500 dark:text-gray-400">{t('detail.stats.events')}</dt>
                <dd className="mt-0.5 truncate font-semibold tabular-nums text-gray-900 dark:text-white">
                  {events.length}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="truncate text-xs text-gray-500 dark:text-gray-400">{t('detail.stats.posts')}</dt>
                <dd className="mt-0.5 truncate font-semibold tabular-nums text-gray-900 dark:text-white">
                  {initialPosts.length}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="truncate text-xs text-gray-500 dark:text-gray-400">{t('detail.stats.createdAt')}</dt>
                <dd
                  className="mt-0.5 truncate font-semibold text-gray-900 dark:text-white"
                  title={format(new Date(club.createdAt), 'PPP', { locale: dateLocale })}
                >
                  {format(new Date(club.createdAt), 'd MMM yyyy', { locale: dateLocale })}
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
                aria-label={t('detail.viewModeAria')}
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

          {/* Owner-only: name administrators */}
          {club.isOwner && (
            <ClubAdminPanel
              clubId={club.id}
              ownerId={club.ownerId}
              members={members}
            />
          )}

          {/* Member composer: share photos / videos / notes */}
          {club.isMember && <ClubPostComposer clubId={club.id} />}

          {/* Highlights row */}
          <ClubHighlightedPosts highlights={highlights} onOpen={openPost} />

          {/* Tab content */}
          <ClubTabContent
            club={club}
            posts={initialPosts}
            activeTab={activeTab}
            viewMode={viewMode}
            canManage={canManageMembers}
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
        {drawer === 'members' && (
          <MembersPanel
            members={members}
            clubId={club.id}
            canManage={canManageMembers}
            subcategory={club.subcategory}
            category={club.category}
          />
        )}
        {drawer === 'events' && <EventsPanel events={events} />}
        {drawer === 'promotions' && <PromotionsPanel promotions={promotions} />}
        {drawer === 'foro' && (
          <ForoPanel foroSpaceSlug={foroSpaceSlug} foroBoard={foroBoard} />
        )}
        {drawer === 'chat' && <PublicChatPanel publicChatId={publicChatId} />}
      </ClubDrawer>

      {/* Post viewer */}
      {openPost_ && (
        <ClubPostModal post={openPost_} onClose={() => setOpenPostId(null)} />
      )}

      {canManageMembers && editDetailsOpen && (
        <EditClubDetailsModal club={club} onClose={() => setEditDetailsOpen(false)} />
      )}
    </div>
  );
}
