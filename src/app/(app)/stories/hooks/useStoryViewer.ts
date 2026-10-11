'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStorySocket } from './useStorySocket'
import { useStoryStore } from '../store'

const STORY_DURATION = 15000

/** Controls story selection, playback, view receipts, and navigation. */
export function useStoryViewer(userId: string) {
  const router = useRouter()
  const { friendsStories, myStories, viewStory, isLoading: isStoreLoading } = useStoryStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  useStorySocket()

  const isMyStories = userId === 'my-stories'
  const allUsers = isMyStories ? [] : friendsStories
  // Store updates to view counts must not move selection back to the URL's user.
  const selectionKey = `${userId}:${allUsers.map((user) => user.userId).join(',')}`
  const initialUserIndex = Math.max(0, allUsers.findIndex((user) => user.userId === userId))
  const [selection, setSelection] = useState(() => ({
    key: selectionKey, userIndex: initialUserIndex, storyIndex: 0,
  }))
  if (selection.key !== selectionKey) {
    setSelection({ key: selectionKey, userIndex: initialUserIndex, storyIndex: 0 })
  }
  const currentUserIndex = selection.userIndex
  const currentStoryIndex = selection.storyIndex
  const currentUserStories = isMyStories ? myStories : allUsers[currentUserIndex]?.stories || []
  const currentStory = currentUserStories[currentStoryIndex]
  const currentUser = isMyStories ? null : allUsers[currentUserIndex]
  const storyId = currentStory?.id

  // Deep links need their own initial fetch when the feed has not loaded yet.
  const [isBootstrapping, setIsBootstrapping] = useState(() => {
    const state = useStoryStore.getState()
    return (isMyStories ? state.myStories : state.friendsStories).length === 0
  })
  useEffect(() => {
    if (!isBootstrapping) return
    let cancelled = false
    const state = useStoryStore.getState()
    ;(isMyStories ? state.fetchMyStories() : state.fetchFriendsStories()).finally(() => {
      if (!cancelled) setIsBootstrapping(false)
    })
    return () => { cancelled = true }
  }, [isBootstrapping, isMyStories])

  useEffect(() => {
    if (storyId && !isMyStories) void viewStory(storyId)
  }, [storyId, isMyStories, viewStory])

  const [playback, setPlayback] = useState<{ storyId: string; progress: number } | null>(null)
  const playbackRef = useRef<{ storyId: string; elapsedMs: number } | null>(null)
  const progress = playback?.storyId === storyId ? playback?.progress ?? 0 : 0
  const resetProgress = useCallback(() => {
    playbackRef.current = null
    setPlayback(null)
  }, [])

  const handleNext = useCallback(() => {
    resetProgress()
    if (currentStoryIndex < currentUserStories.length - 1) {
      setSelection((previous) => ({ ...previous, storyIndex: previous.storyIndex + 1 }))
    } else if (!isMyStories && currentUserIndex < allUsers.length - 1) {
      setSelection((previous) => ({ ...previous, userIndex: previous.userIndex + 1, storyIndex: 0 }))
    } else {
      router.push('/feed')
    }
  }, [resetProgress, currentStoryIndex, currentUserStories.length, isMyStories, currentUserIndex, allUsers.length, router])

  const duration = currentStory?.type === 'video' ? (currentStory.duration || 15) * 1000 : STORY_DURATION
  useEffect(() => {
    if (!storyId || isPaused) return
    let elapsedMs = playbackRef.current?.storyId === storyId ? playbackRef.current.elapsedMs : 0
    playbackRef.current = { storyId, elapsedMs }
    const interval = setInterval(() => {
      elapsedMs = Math.min(duration, elapsedMs + 50)
      playbackRef.current = { storyId, elapsedMs }
      setPlayback({ storyId, progress: (elapsedMs / duration) * 100 })
      if (elapsedMs >= duration) {
        clearInterval(interval)
        // Navigation is an external timer action, never a state-updater side effect.
        handleNext()
      }
    }, 50)
    return () => clearInterval(interval)
  }, [storyId, duration, isPaused, handleNext])

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setSelection((previous) => ({ ...previous, storyIndex: previous.storyIndex - 1 }))
      resetProgress()
    } else if (!isMyStories && currentUserIndex > 0) {
      setSelection((previous) => ({ ...previous, userIndex: previous.userIndex - 1, storyIndex: 0 }))
      resetProgress()
    }
  }

  const handleClose = () => router.push('/feed')
  return {
    videoRef,
    isLoading: isBootstrapping || isStoreLoading,
    isMyStories,
    currentUser,
    currentStory,
    currentUserStories,
    currentStoryIndex,
    currentUserIndex,
    progress,
    setIsPaused,
    handleNext,
    handlePrevious,
    handleClose,
  }
}
