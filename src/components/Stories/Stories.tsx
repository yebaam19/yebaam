'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PlusIcon } from '@/components/icons/heroicons-shim';
import { useAuth } from '@/features/auth/context/auth-context';
import { useStoryStore } from '@/app/(app)/stories/store/story.store';
import { useStorySocket } from '@/app/(app)/stories/hooks/useStorySocket';
import type { Story } from '@/app/(app)/stories/services/story.service';
import { streamThumb } from '@/lib/media/urls';
import Avatar from '@/ui/Avatar';

function storyPreviewSrc(story: Story): string | null {
  if (story.type === 'video') {
    if (story.cloudflareStreamUid) return streamThumb(story.cloudflareStreamUid, { width: 240 });
    if (story.thumbnailUrl) return story.thumbnailUrl;
    return null;
  }
  return story.mediaUrl ?? null;
}

interface StoriesProps {
  className?: string;
}

export default function Stories({ className }: StoriesProps) {
  const t = useTranslations('stories.row');
  const router = useRouter();
  const { user } = useAuth();
  const { friendsStories, myStories, fetchFriendsStories, fetchMyStories, isLoading } = useStoryStore();
  
  // Conectar WebSocket para recibir actualizaciones en tiempo real
  useStorySocket();

  // Cargar historias al montar el componente
  useEffect(() => {
    fetchFriendsStories();
    fetchMyStories();
  }, [fetchFriendsStories, fetchMyStories]);

  const hasMyStories = myStories.length > 0;

  const handleCreateStory = () => {
    router.push('/stories/create');
  };

  const handleViewStory = (userId: string) => {
    router.push(`/stories/view/${userId}`);
  };

  const handleViewMyStories = () => {
    router.push('/stories/view/my-stories');
  };

  if (isLoading && !hasMyStories && friendsStories.length === 0) {
    return (
      <div className={`bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-4 ${className || ''}`}>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Loading skeletons */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[120px] h-[200px] rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // When the rail is functionally empty (no own stories AND no friend stories)
  // the standard "create tile + scroll row" loses to dead air. Render a hero
  // canvas instead: one inviting surface that fills the rail at the same
  // height as the tiles, so the card doesn't change vertical rhythm.
  const isEmpty = !isLoading && !hasMyStories && friendsStories.length === 0
  if (isEmpty) {
    return (
      <div className={`rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-900 ${className || ''}`}>
        <StoryRailEmptyHero
          onCreate={handleCreateStory}
          user={user}
          ariaLabel={t('createFirstAria')}
          title={t('emptyHeroTitle')}
          subtitle={t('emptyHeroSubtitle')}
          cta={t('emptyHeroCta')}
        />
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-4 ${className || ''}`}>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Mi Historia */}
        <div
          onClick={hasMyStories ? handleViewMyStories : handleCreateStory}
          className="shrink-0 w-[120px] h-[200px] rounded-2xl relative cursor-pointer hover:scale-105 transition-transform overflow-hidden group"
        >
          {hasMyStories ? (
            // Ver mis historias
            <div className="w-full h-full relative">
              {/* Preview de la última historia */}
              {(() => {
                const preview = storyPreviewSrc(myStories[0])
                return preview ? (
                  <img
                    src={preview}
                    alt={myStories[0].type === 'video' ? t('myStoryVideoAlt') : t('myStoryAlt')}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-700" />
                )
              })()}

              {/* Overlay */}
              <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/60" />

              {/* Avatar y nombre */}
              <div className="absolute top-3 left-3">
                <div className="w-10 h-10 rounded-full ring-4 ring-primary-500">
                  <Avatar
                    initials={user?.username.substring(0, 2).toUpperCase() || 'TU'}
                    src={user?.avatar}
                    className="w-full h-full"
                  />
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-sm font-semibold drop-shadow-lg">
                  {t('yourStory')}
                </p>
                <p className="text-white/80 text-xs">
                  {t('storyCount', { count: myStories.length })}
                </p>
              </div>
            </div>
          ) : (
            // Crear historia
            <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex flex-col">
              <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                <Avatar
                  initials={user?.username.substring(0, 2).toUpperCase() || 'TU'}
                  src={user?.avatar}
                  className="w-16 h-16"
                />
              </div>
              <div className="p-3 flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center -mt-8 ring-4 ring-white dark:ring-neutral-900">
                  <PlusIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white text-center">
                  {t('createStory')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Historias de Amigos */}
        {friendsStories.map((userStories) => (
          <div
            key={userStories.userId}
            onClick={() => handleViewStory(userStories.userId)}
            className="shrink-0 w-[120px] h-[200px] rounded-2xl relative cursor-pointer hover:scale-105 transition-transform overflow-hidden group"
          >
            <div className="w-full h-full relative">
              {/* Preview de la última historia */}
              {(() => {
                const preview = storyPreviewSrc(userStories.stories[0])
                return preview ? (
                  <img
                    src={preview}
                    alt={userStories.username}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-700" />
                )
              })()}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/60" />
              
              {/* Avatar con borde según si fue vista o no */}
              <div className="absolute top-3 left-3">
                <div className={`w-10 h-10 rounded-full ring-4 ${
                  userStories.unviewedCount > 0 
                    ? 'ring-primary-500' 
                    : 'ring-neutral-500'
                }`}>
                  <Avatar
                    initials={userStories.username.substring(0, 2).toUpperCase()}
                    src={userStories.avatarUrl}
                    className="w-full h-full"
                  />
                </div>
                
                {/* Badge de historias no vistas */}
                {userStories.unviewedCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
                    <span className="text-[10px] font-bold text-white">
                      {userStories.unviewedCount}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-sm font-semibold drop-shadow-lg truncate">
                  {userStories.username}
                </p>
                <p className="text-white/80 text-xs">
                  {t('storyCount', { count: userStories.stories.length })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Placeholder tiles cuando no hay historias — mantiene el ritmo
            horizontal del carrusel en vez de un mensaje a ancho completo. */}
        {!isLoading && !hasMyStories && friendsStories.length === 0 && (
          <>
            <StoryPlaceholder label={t('emptyTile')} />
            <StoryPlaceholder dim />
            <StoryPlaceholder dim />
          </>
        )}
      </div>
    </div>
  );
}

interface HeroProps {
  onCreate: () => void;
  user: { username: string; avatar?: string } | null | undefined;
  ariaLabel: string;
  title: string;
  subtitle: string;
  cta: string;
}

/** Single-canvas empty state for the story rail. Replaces the "tiny tile + dead
 *  text" combo when there are zero stories anywhere. Same height as the regular
 *  tiles (200px) so the card's vertical rhythm stays put. */
function StoryRailEmptyHero({ onCreate, user, ariaLabel, title, subtitle, cta }: HeroProps) {
  const initials = user?.username.substring(0, 2).toUpperCase() || 'TU';
  return (
    <button
      type="button"
      onClick={onCreate}
      className="group relative flex h-50 w-full items-center gap-5 overflow-hidden rounded-2xl bg-linear-to-br from-emerald-50 via-amber-50 to-orange-50 px-5 text-left transition-colors hover:from-emerald-100 hover:via-amber-100 hover:to-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:px-7 dark:from-emerald-950/30 dark:via-neutral-800 dark:to-orange-950/20 dark:hover:from-emerald-900/30 dark:hover:to-orange-900/20"
      aria-label={ariaLabel}
    >
      {/* Soft decorative dots, anchored top-right so they don't fight the avatar */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-6 -right-6 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl dark:bg-amber-500/10"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-4 h-28 w-28 rounded-full bg-emerald-200/40 blur-2xl dark:bg-emerald-500/10"
      />

      {/* Avatar + plus badge */}
      <div className="relative shrink-0">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-neutral-200 shadow-md ring-2 ring-white sm:h-20 sm:w-20 dark:bg-neutral-700 dark:ring-neutral-800">
          <Avatar initials={initials} src={user?.avatar} className="h-full w-full" />
        </div>
        <span className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 shadow-sm ring-2 ring-white transition-transform duration-200 ease-out group-hover:scale-110 dark:ring-neutral-900">
          <PlusIcon className="h-4 w-4 text-white" />
        </span>
      </div>

      {/* Copy + CTA */}
      <div className="relative min-w-0 flex-1">
        <p className="text-base font-semibold text-neutral-900 sm:text-lg dark:text-white">
          {title}
        </p>
        <p className="mt-1 text-xs text-neutral-600 sm:text-sm dark:text-neutral-300">
          {subtitle}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-primary-700">
          {cta}
        </span>
      </div>
    </button>
  );
}

function StoryPlaceholder({ label, dim }: { label?: string; dim?: boolean }) {
  return (
    <div
      aria-hidden
      className={
        'shrink-0 w-[120px] h-[200px] rounded-2xl flex items-center justify-center text-center px-3 ' +
        (dim
          ? 'bg-neutral-100 dark:bg-neutral-800/60'
          : 'border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900')
      }
    >
      {label && (
        <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          {label}
        </p>
      )}
    </div>
  );
}
