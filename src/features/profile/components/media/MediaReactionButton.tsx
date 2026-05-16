'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { HeartIcon } from '@/components/icons/heroicons-shim';
import {
  profileMediaInteractionsService,
  ReactionType,
  EntityType,
} from '@/features/profile/services/profile-media-interactions.service';
import MediaReactionListModal from './MediaReactionListModal';

interface MediaReactionButtonProps {
  entityType: EntityType;
  entityId: string;
  initialLikesCount: number;
  onReactionChange?: (count: number) => void;
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠',
};

const REACTION_ORDER: ReactionType[] = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

export default function MediaReactionButton({
  entityType,
  entityId,
  initialLikesCount,
  onReactionChange,
}: MediaReactionButtonProps) {
  const t = useTranslations('profile.media.reactionButton');
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [showPicker, setShowPicker] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressFiredRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const reaction = await profileMediaInteractionsService.getMyReaction(
          entityType,
          entityId,
        );
        if (cancelled) return;
        setMyReaction(reaction ? reaction.type : null);
      } catch (error) {
        console.error('Error loading reaction:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    };
  }, []);

  // Cerrar el picker al tocar fuera (móvil) o presionar Escape
  useEffect(() => {
    if (!showPicker) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPicker(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showPicker]);

  const handleReact = async (type: ReactionType) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const wasReacted = myReaction !== null;

      if (myReaction === type) {
        await profileMediaInteractionsService.unreact(entityType, entityId);
        setMyReaction(null);
        const newCount = Math.max(0, likesCount - 1);
        setLikesCount(newCount);
        onReactionChange?.(newCount);
      } else {
        await profileMediaInteractionsService.react(entityType, entityId, type);
        setMyReaction(type);
        const newCount = wasReacted ? likesCount : likesCount + 1;
        setLikesCount(newCount);
        onReactionChange?.(newCount);
      }

      setShowPicker(false);
    } catch (error) {
      console.error('Error reacting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickClick = () => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (myReaction) {
      handleReact(myReaction); // toggle off
    } else {
      handleReact('like');
    }
  };

  const cancelHide = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const scheduleShow = () => {
    cancelHide();
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => setShowPicker(true), 300);
  };

  const scheduleHide = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setShowPicker(false), 250);
  };

  const handleTouchStart = () => {
    longPressFiredRef.current = false;
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setShowPicker(true);
    }, 350);
  };

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        ref={containerRef}
        className="relative inline-block"
        onMouseEnter={scheduleShow}
        onMouseLeave={scheduleHide}
      >
        <button
          type="button"
          onClick={handleQuickClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all select-none ${
            myReaction
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-haspopup="menu"
          aria-expanded={showPicker}
        >
          {myReaction ? (
            <>
              <span className="text-xl leading-none">{REACTION_EMOJIS[myReaction]}</span>
              <span>{t(myReaction)}</span>
            </>
          ) : (
            <>
              <HeartIcon className="w-5 h-5" />
              <span>{t('defaultLabel')}</span>
            </>
          )}
        </button>

        {showPicker && (
          <div
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex gap-1 animate-in fade-in zoom-in-95 duration-200"
            role="menu"
            aria-label={t('pickerAria')}
          >
            {REACTION_ORDER.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleReact(type)}
                className={`relative group w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-125 hover:-translate-y-1 ${
                  myReaction === type ? 'scale-110' : ''
                }`}
                title={t(type)}
                aria-label={t(type)}
                role="menuitem"
              >
                <span className="text-2xl">{REACTION_EMOJIS[type]}</span>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  {t(type)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {likesCount > 0 && (
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
          aria-label={t('viewReactionsAria', { count: likesCount })}
        >
          {t('reactionsCount', { count: likesCount })}
        </button>
      )}

      <MediaReactionListModal
        isOpen={listOpen}
        onClose={() => setListOpen(false)}
        entityType={entityType}
        entityId={entityId}
      />
    </div>
  );
}
