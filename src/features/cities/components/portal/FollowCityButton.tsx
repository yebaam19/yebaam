'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { followCity, unfollowCity } from '@/features/cities/actions/city.actions';
import { CheckBadgeIcon, PlusIcon } from '@/components/icons/heroicons-shim';

interface FollowCityButtonProps {
  cityId: string;
  citySlug: string;
  initialFollowing: boolean;
}

/**
 * Optimistic Seguir / Siguiendo toggle anchored to the portal cover.
 *
 * Uses React 19's `useOptimistic` to flip the visible state instantly inside
 * the surrounding `startTransition`, while the server action runs. If the
 * action returns `{ ok: false, error: 'unauthenticated' }`, the optimistic
 * state is reset and the browser is bounced to `/login` with a redirect
 * back to this city. Any other error surfaces inline.
 */
export function FollowCityButton({
  cityId,
  citySlug,
  initialFollowing,
}: FollowCityButtonProps) {
  const t = useTranslations('cities.portal');
  const router = useRouter();
  const [serverFollowing, setServerFollowing] = useState(initialFollowing);
  const [optimisticFollowing, setOptimisticFollowing] = useOptimistic(
    serverFollowing,
    (_state, next: boolean) => next,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const next = !optimisticFollowing;
      setOptimisticFollowing(next);
      const action = next ? followCity : unfollowCity;
      const result = await action(cityId);
      if (!result.ok) {
        if (result.error === 'unauthenticated') {
          router.push(`/login?redirect=/cities/${citySlug}`);
          return;
        }
        setError(result.error);
        return;
      }
      setServerFollowing(next);
      router.refresh();
    });
  };

  const showFollowing = optimisticFollowing;
  const label = showFollowing ? t('following') : t('follow');
  const hoverLabel = showFollowing ? t('unfollow') : t('follow');

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={showFollowing}
        aria-label={hoverLabel}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-md backdrop-blur-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60 ${
          showFollowing
            ? 'bg-white/95 text-primary-700 hover:bg-white hover:text-red-600 dark:bg-neutral-900/90 dark:text-primary-300 dark:hover:bg-neutral-900'
            : 'bg-primary-600 text-white hover:bg-primary-700'
        }`}
      >
        {showFollowing ? (
          <CheckBadgeIcon className="h-4 w-4" />
        ) : (
          <PlusIcon className="h-4 w-4" />
        )}
        <span>{label}</span>
      </button>
      {error && (
        <p className="max-w-xs rounded bg-red-50 px-2 py-1 text-right text-xs text-red-700 dark:bg-red-900/40 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
