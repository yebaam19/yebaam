'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { imageUrl } from '@/lib/media/urls';
import { UserIcon } from '@/components/icons/heroicons-shim';
import {
  createMusicClubPost,
  deleteMusicClubPost,
} from '../../actions/music-posts.actions';
import type { ClubPostRow } from '../../types/music.types';
import type { ClubJoinStatus } from '../../server/clubs.server';
import { ClubJoinCTA } from './ClubJoinCTA';

interface Props {
  clubId: string;
  clubSlug: string;
  posts: ClubPostRow[];
  canPost: boolean;
  joinStatus: ClubJoinStatus;
  viewerId: string | null;
  canModerate: boolean;
}

/** Posts feed with inline composer at top. Members write notes, share albums,
 *  link articles, post media. Non-members see an inline join CTA. */
export function MusicPostsFeed({
  clubId,
  clubSlug,
  posts,
  canPost,
  joinStatus,
  viewerId,
  canModerate,
}: Props) {
  const router = useRouter();
  const t = useTranslations('musica.club.posts');
  return (
    <div className="space-y-4">
      {canPost ? (
        <Composer clubId={clubId} onCreated={() => router.refresh()} />
      ) : (
        <ClubJoinCTA
          clubId={clubId}
          clubSlug={clubSlug}
          status={joinStatus}
          label={t('joinToPost')}
        />
      )}

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          {t('empty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              canDelete={canModerate || p.author_id === viewerId}
              onDeleted={() => router.refresh()}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function Composer({
  clubId,
  onCreated,
}: {
  clubId: string;
  onCreated: () => void;
}) {
  const t = useTranslations('musica.club.posts');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createMusicClubPost({ clubId, kind: 'NOTE', body });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onCreated();
      setBody('');
    });
  }

  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={t('newPlaceholder')}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !body.trim()}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-40"
        >
          {pending ? t('publishing') : t('publish')}
        </button>
      </div>
    </div>
  );
}

function PostCard({
  post,
  canDelete,
  onDeleted,
}: {
  post: ClubPostRow;
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const t = useTranslations('musica.club.posts');
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const avatar = post.author?.avatar_cf_image_id
    ? imageUrl(post.author.avatar_cf_image_id, 'avatar')
    : null;

  function handleDelete() {
    if (!confirm(t('confirmDeletePost'))) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteMusicClubPost(post.id);
      if (!res.ok) setError(res.error);
      else onDeleted();
    });
  }

  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 flex-none overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserIcon className="h-4 w-4 text-zinc-400" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {post.author?.full_name || post.author?.username || t('fallbackMember')}
          </p>
          <p className="text-xs text-zinc-500">{formatDate(post.created_at, locale)}</p>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-xs text-zinc-400 hover:text-rose-600 disabled:opacity-40"
          >
            {t('delete')}
          </button>
        )}
      </div>
      {post.title && (
        <h3 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {post.title}
        </h3>
      )}
      {post.body && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {post.body}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </li>
  );
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}
