'use client';

import { useState, useEffect } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { 
  profileMediaInteractionsService, 
  ReactionType,
  EntityType 
} from '@/features/profile/services/profile-media-interactions.service';

interface MediaReactionButtonProps {
  entityType: EntityType;
  entityId: string;
  initialLikesCount: number;
  onReactionChange?: (count: number) => void;
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  wow: '😮',
  haha: '😄',
  sad: '😢',
  angry: '😠',
};

export default function MediaReactionButton({
  entityType,
  entityId,
  initialLikesCount,
  onReactionChange,
}: MediaReactionButtonProps) {
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMyReaction();
  }, [entityId]);

  const loadMyReaction = async () => {
    try {
      const reaction = await profileMediaInteractionsService.getMyReaction(entityType, entityId);
      if (reaction) {
        setMyReaction(reaction.type);
      }
    } catch (error) {
      console.error('Error loading reaction:', error);
    }
  };

  const handleReact = async (type: ReactionType) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const wasReacted = myReaction !== null;

      if (myReaction === type) {
        // Quitar reacción si es la misma
        await profileMediaInteractionsService.unreact(entityType, entityId);
        setMyReaction(null);
        const newCount = likesCount - 1;
        setLikesCount(newCount);
        onReactionChange?.(newCount);
      } else {
        // Agregar o cambiar reacción
        await profileMediaInteractionsService.react(entityType, entityId, type);
        setMyReaction(type);
        const newCount = wasReacted ? likesCount : likesCount + 1;
        setLikesCount(newCount);
        onReactionChange?.(newCount);
      }

      setShowReactionPicker(false);
    } catch (error) {
      console.error('Error reacting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLike = () => {
    if (!myReaction) {
      handleReact('like');
    } else if (myReaction === 'like') {
      handleReact('like'); // Esto quitará la reacción
    } else {
      setShowReactionPicker(!showReactionPicker);
    }
  };

  return (
    <div className="relative">
      {/* Reaction Button */}
      <button
        onClick={handleQuickLike}
        onMouseEnter={() => setShowReactionPicker(true)}
        onMouseLeave={() => setTimeout(() => setShowReactionPicker(false), 200)}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          myReaction
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {myReaction ? (
          <>
            <span className="text-xl">{REACTION_EMOJIS[myReaction]}</span>
            <span className="capitalize">{myReaction}</span>
          </>
        ) : (
          <>
            <HeartIcon className="w-5 h-5" />
            <span>Me gusta</span>
          </>
        )}
        {likesCount > 0 && (
          <span className="text-sm">({likesCount})</span>
        )}
      </button>

      {/* Reaction Picker */}
      {showReactionPicker && (
        <div
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
          className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex gap-1 z-10"
        >
          {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleReact(type)}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                myReaction === type ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
              title={type}
            >
              <span className="text-2xl">{REACTION_EMOJIS[type]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
