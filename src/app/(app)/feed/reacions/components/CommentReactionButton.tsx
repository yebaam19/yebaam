'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth'
import { useReactionStore } from '../store/reaction.store'
import { REACTION_CONFIGS, ReactionType } from '../interfaces/reaction.interfaces'
import { ReactionPicker } from './ReactionPicker/ReactionPicker'

interface CommentReactionButtonProps {
  commentId: string
}

export function CommentReactionButton({ commentId }: CommentReactionButtonProps) {
  const { user } = useAuth()
  const myReaction = useReactionStore((s) => s.myReactionsByComment[commentId])
  const counts = useReactionStore((s) => s.countsByComment[commentId])
  const reactToComment = useReactionStore((s) => s.reactToComment)
  const unreactComment = useReactionStore((s) => s.unreactComment)
  const updateCommentReaction = useReactionStore((s) => s.updateCommentReaction)

  const [showPicker, setShowPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFiredRef = useRef(false)

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!showPicker) return
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPicker(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showPicker])

  if (!user) return null

  const total =
    (counts?.LIKE ?? 0) +
    (counts?.LOVE ?? 0) +
    (counts?.HAHA ?? 0) +
    (counts?.WOW ?? 0) +
    (counts?.SAD ?? 0) +
    (counts?.ANGRY ?? 0)

  const cancelHide = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }

  const scheduleShow = () => {
    cancelHide()
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current)
    showTimeoutRef.current = setTimeout(() => setShowPicker(true), 350)
  }

  const scheduleHide = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => setShowPicker(false), 250)
  }

  const handleClick = async () => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false
      return
    }
    if (myReaction) {
      await unreactComment(commentId)
    } else {
      await reactToComment(commentId, ReactionType.LIKE)
    }
  }

  const handleSelect = async (type: ReactionType) => {
    setShowPicker(false)
    if (myReaction) {
      await updateCommentReaction(commentId, type)
    } else {
      await reactToComment(commentId, type)
    }
  }

  const handleTouchStart = () => {
    longPressFiredRef.current = false
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current)
    longPressTimeoutRef.current = setTimeout(() => {
      longPressFiredRef.current = true
      setShowPicker(true)
    }, 350)
  }

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }

  const config = myReaction ? REACTION_CONFIGS[myReaction.type] : null
  const label = config?.label ?? 'Me gusta'
  const emoji = config?.emoji
  const colorStyle = config?.color ? { color: config.color } : undefined

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={scheduleShow}
      onMouseLeave={scheduleHide}
    >
      <button
        type="button"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={colorStyle}
        className={`flex items-center gap-1 text-xs font-semibold transition-colors select-none ${
          myReaction ? '' : 'text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400'
        }`}
        aria-label={label}
        aria-expanded={showPicker}
        aria-haspopup="menu"
      >
        {emoji ? <span aria-hidden="true">{emoji}</span> : null}
        <span>{label}</span>
        {total > 0 ? <span className="text-neutral-500 dark:text-neutral-400">· {total}</span> : null}
      </button>

      {showPicker ? (
        <div onMouseEnter={cancelHide} onMouseLeave={scheduleHide}>
          <ReactionPicker onSelect={handleSelect} currentReaction={myReaction?.type} />
        </div>
      ) : null}
    </div>
  )
}

export default CommentReactionButton
