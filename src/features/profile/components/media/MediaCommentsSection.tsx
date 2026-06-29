'use client';

import { useState, useEffect } from 'react';
import { ChatBubbleOvalLeftIcon, TrashIcon } from '@/components/icons/heroicons-shim';
import { UserIcon } from '@/components/icons/heroicons-shim';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth';
import { getUserDisplayName } from '@/lib/user-helpers';
import {
  profileMediaInteractionsService,
  Comment,
  EntityType,
} from '@/features/profile/services/profile-media-interactions.service';

interface MediaCommentsSectionProps {
  entityType: EntityType;
  entityId: string;
  initialCommentsCount: number;
  onCommentsCountChange?: (count: number) => void;
}

export default function MediaCommentsSection({
  entityType,
  entityId,
  initialCommentsCount,
  onCommentsCountChange,
}: MediaCommentsSectionProps) {
  const t = useTranslations('profile.mediaComments');
  const locale = useLocale();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount || 0);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});

  useEffect(() => {
    loadComments();
  }, [entityId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await profileMediaInteractionsService.getComments(entityType, entityId);
      setComments(Array.isArray(response.comments) ? response.comments : []);
      setCommentsCount(response.total || 0);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
      setCommentsCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReplies = async (commentId: string) => {
    try {
      const commentReplies = await profileMediaInteractionsService.getCommentReplies(
        entityType,
        entityId,
        commentId
      );
      setReplies((prev) => ({ ...prev, [commentId]: commentReplies }));
      setExpandedReplies((prev) => new Set(prev).add(commentId));
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const toggleReplies = (commentId: string) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      loadReplies(commentId);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const comment = await profileMediaInteractionsService.comment(
        entityType,
        entityId,
        newComment.trim(),
        replyTo?.id
      );

      if (replyTo) {
        // Es una respuesta - actualizar replies
        setReplies((prev) => ({
          ...prev,
          [replyTo.id]: [...(prev[replyTo.id] || []), comment],
        }));
      } else {
        // Es un comentario raíz - actualizar lista
        setComments((prev) => [comment, ...(Array.isArray(prev) ? prev : [])]);
        const newCount = commentsCount + 1;
        setCommentsCount(newCount);
        onCommentsCountChange?.(newCount);
      }

      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, isReply: boolean, parentId?: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      await profileMediaInteractionsService.deleteComment(entityType, entityId, commentId);

      if (isReply && parentId) {
        // Eliminar de replies
        setReplies((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter((r) => r.id !== commentId),
        }));
      } else {
        // Eliminar de comentarios raíz
        setComments((prev) => (Array.isArray(prev) ? prev.filter((c) => c.id !== commentId) : []));
        const newCount = commentsCount - 1;
        setCommentsCount(newCount);
        onCommentsCountChange?.(newCount);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const CommentItem = ({
    comment,
    isReply = false,
    parentId,
  }: {
    comment: Comment;
    isReply?: boolean;
    parentId?: string;
  }) => (
    <div className={`${isReply ? 'ml-12 mt-2' : 'mb-4'}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        {comment.user.avatar ? (
          <Image
            src={comment.user.avatar}
            alt={comment.user.username}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <UserIcon className="w-5 h-5 text-gray-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Comment content */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              {getUserDisplayName(comment.user)}
            </p>
            <p className="text-gray-800 dark:text-gray-200 wrap-break-word">{comment.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 px-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(comment.createdAt).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            {!isReply && (
              <button
                onClick={() => setReplyTo({ id: comment.id, username: comment.user.username })}
                className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {t('reply')}
              </button>
            )}

            {comment.repliesCount > 0 && !isReply && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {expandedReplies.has(comment.id)
                  ? t('hideReplies')
                  : t('viewReplies', { count: comment.repliesCount })}
              </button>
            )}

            {user && comment.user.id === user.id && (
              <button
                onClick={() => handleDeleteComment(comment.id, isReply, parentId)}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-auto"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Replies */}
          {expandedReplies.has(comment.id) && replies[comment.id] && (
            <div className="mt-2">
              {replies[comment.id].map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply
                  parentId={comment.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <ChatBubbleOvalLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t('commentsCount', { count: commentsCount })}
        </h3>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-[400px]">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : !comments || comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ChatBubbleOvalLeftIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('beFirstToComment')}</p>
          </div>
        ) : (
          Array.isArray(comments) && comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
        )}
      </div>

      {/* Comment input */}
      <form onSubmit={handleSubmitComment} className="border-t border-gray-200 dark:border-gray-700 pt-4">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{t('replyingTo', { username: replyTo.username })}</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-red-600 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex gap-2">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={user.username || 'User'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? t('writeReplyPlaceholder') : t('writeCommentPlaceholder')}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full border-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full font-medium transition-colors"
          >
            {isSubmitting ? t('sending') : t('send')}
          </button>
        </div>
      </form>
    </div>
  );
}
