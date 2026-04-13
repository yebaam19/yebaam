'use client';

import { useState } from 'react';
import {
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
} from '@/components/icons/heroicons-shim';
import {
  HandThumbUpIcon as HandThumbUpSolidIcon,
  HeartIcon as HeartSolidIcon,
  FaceSmileIcon as FaceSmileSolidIcon,
} from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';

interface PostActionsProps {
  postId: string;
  reactionsCount: Record<string, number>;
  commentsCount: number;
  sharesCount: number;
}

type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

const REACTIONS: Array<{
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}> = [
  { type: 'LIKE', emoji: '👍', label: 'Me gusta', color: 'text-blue-600' },
  { type: 'LOVE', emoji: '❤️', label: 'Me encanta', color: 'text-red-600' },
  { type: 'HAHA', emoji: '😂', label: 'Me divierte', color: 'text-yellow-600' },
  { type: 'WOW', emoji: '😮', label: 'Me asombra', color: 'text-orange-600' },
  { type: 'SAD', emoji: '😢', label: 'Me entristece', color: 'text-neutral-600' },
  { type: 'ANGRY', emoji: '😡', label: 'Me enoja', color: 'text-red-700' },
];

export default function PostActions({
  postId,
  reactionsCount,
  commentsCount,
  sharesCount,
}: PostActionsProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(null);
  const [localReactionsCount, setLocalReactionsCount] = useState(reactionsCount);
  const [localCommentsCount] = useState(commentsCount);
  const [localSharesCount] = useState(sharesCount);

  // Calcular total de reacciones
  const totalReactions = Object.values(localReactionsCount).reduce(
    (sum, count) => sum + count,
    0
  );

  // Obtener las 3 reacciones más populares
  const topReactions = Object.entries(localReactionsCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);

  const handleReaction = (type: ReactionType) => {
    setShowReactionPicker(false);

    if (currentReaction === type) {
      // Remove reaction
      setCurrentReaction(null);
      setLocalReactionsCount((prev) => ({
        ...prev,
        [type]: Math.max((prev[type] || 0) - 1, 0),
      }));
    } else {
      // Add or change reaction
      const newCounts = { ...localReactionsCount };

      // Remove old reaction
      if (currentReaction) {
        newCounts[currentReaction] = Math.max((newCounts[currentReaction] || 0) - 1, 0);
      }

      // Add new reaction
      newCounts[type] = (newCounts[type] || 0) + 1;

      setCurrentReaction(type);
      setLocalReactionsCount(newCounts);
    }

    // TODO: Send to backend
    console.log('React to post:', postId, type);
  };

  const handleLike = () => {
    if (currentReaction) {
      // Remove reaction
      handleReaction(currentReaction);
    } else {
      // Add like
      handleReaction('LIKE');
    }
  };

  const getReactionIcon = (type: string) => {
    const reaction = REACTIONS.find((r) => r.type === type);
    return reaction?.emoji || '👍';
  };

  return (
    <div>
      {/* Stats */}
      {(totalReactions > 0 || localCommentsCount > 0 || localSharesCount > 0) && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            {totalReactions > 0 && (
              <div className="flex items-center gap-1">
                {/* Top Reactions Icons */}
                <div className="flex items-center -space-x-1">
                  {topReactions.map((type, index) => (
                    <span
                      key={type}
                      className="text-sm"
                      style={{ zIndex: topReactions.length - index }}
                    >
                      {getReactionIcon(type)}
                    </span>
                  ))}
                </div>
                <span className="text-sm text-neutral-600 dark:text-neutral-400 hover:underline cursor-pointer">
                  {totalReactions}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            {localCommentsCount > 0 && (
              <button className="hover:underline">
                {localCommentsCount} {localCommentsCount === 1 ? 'comentario' : 'comentarios'}
              </button>
            )}
            {localSharesCount > 0 && (
              <button className="hover:underline">
                {localSharesCount} {localSharesCount === 1 ? 'compartido' : 'compartidos'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center border-t border-neutral-200 dark:border-neutral-800 px-2 py-1">
        {/* Like Button with Reaction Picker */}
        <div className="relative flex-1">
          <button
            onClick={handleLike}
            onMouseEnter={() => setShowReactionPicker(true)}
            onMouseLeave={() => setShowReactionPicker(false)}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-colors',
              currentReaction
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            )}
          >
            {currentReaction ? (
              <>
                <span className="text-lg">{getReactionIcon(currentReaction)}</span>
                <span className="text-sm">
                  {REACTIONS.find((r) => r.type === currentReaction)?.label}
                </span>
              </>
            ) : (
              <>
                <HandThumbUpIcon className="h-5 w-5" />
                <span className="text-sm">Me gusta</span>
              </>
            )}
          </button>

          {/* Reaction Picker */}
          {showReactionPicker && (
            <div
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setShowReactionPicker(false)}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white dark:bg-neutral-800 rounded-full shadow-2xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 flex items-center gap-1 z-10"
            >
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  className="group relative flex flex-col items-center transition-transform hover:scale-125"
                  title={reaction.label}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {reaction.emoji}
                  </span>
                  <span className="absolute -bottom-6 opacity-0 group-hover:opacity-100 text-xs whitespace-nowrap bg-neutral-900 dark:bg-neutral-700 text-white px-2 py-1 rounded transition-opacity">
                    {reaction.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment Button */}
        <button className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <ChatBubbleLeftIcon className="h-5 w-5" />
          <span className="text-sm">Comentar</span>
        </button>

        {/* Share Button */}
        <button className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <ShareIcon className="h-5 w-5" />
          <span className="text-sm">Compartir</span>
        </button>
      </div>
    </div>
  );
}
