'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { UserPlusIcon } from '@/components/icons/heroicons-shim';
import { addCommunityMemberByUsernameAction } from '@/features/communities/actions/moderation.actions';
import { invalidate } from '@/lib/hooks/cacheStore';

/**
 * Owner/admin "Agregar persona" control: an @username input that directly adds
 * an existing user to the community as a MEMBER. Distinct from the invitation
 * flow — the target is added immediately, no acceptance required.
 */
export function AddCommunityMemberForm({ communityId }: { communityId: string }) {
  const t = useTranslations('communities');
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const value = username.trim();
    if (!value) {
      setError(t('admin.panel.addUsernameRequired'));
      return;
    }
    startTransition(async () => {
      const result = await addCommunityMemberByUsernameAction(communityId, value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(t('admin.panel.addSuccess', { username: result.data.user.username }));
      setUsername('');
      invalidate('communities::detail');
      invalidate('communities::members');
      router.refresh();
    });
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
        <UserPlusIcon className="h-4 w-4 text-blue-500" />
        {t('admin.panel.addSectionTitle')}
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('admin.panel.addPlaceholder')}
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || !username.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? t('admin.panel.addSubmitting') : t('admin.panel.addSubmit')}
        </button>
      </form>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('admin.panel.addHint')}</p>
      {success && <p className="mt-2 text-sm text-green-700 dark:text-green-400">{success}</p>}
      {error && (
        <p className="mt-2 rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
