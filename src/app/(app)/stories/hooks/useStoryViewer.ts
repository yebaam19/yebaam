'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStorySocket } from './useStorySocket'
import { useStoryStore } from '../store'

const STORY_DURATION = 15000 // 15 segundos para imágenes

/**
 * Playback state machine for the story viewer page: tracks which user/story is
 * active, drives the auto-advance progress timer, marks stories as viewed, and
 * exposes the next/previous/close handlers. The page only renders what this
 * returns.
 */
export function useStoryViewer(userId: string) {
  const router = useRouter()

  const { friendsStories, myStories, viewStory, isLoading: isStoreLoading } = useStoryStore()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // WebSocket
  useStorySocket()

  // Determinar si estamos viendo nuestras historias o de amigos
  const isMyStories = userId === 'my-stories'
  const allUsers = isMyStories ? [] : friendsStories

  // On reload / deep-link the store is empty (only the feed rail fetches), so
  // the viewer would sit on "No hay historias" forever. If the relevant list is
  // empty at mount, fetch it once and report `isLoading` until it settles.
  const [isBootstrapping, setIsBootstrapping] = useState(() => {
    const s = useStoryStore.getState()
    return (isMyStories ? s.myStories : s.friendsStories).length === 0
  })
  useEffect(() => {
    if (!isBootstrapping) return
    let cancelled = false
    const s = useStoryStore.getState()
    // The store's in-flight guard collapses StrictMode's double invoke.
    ;(isMyStories ? s.fetchMyStories() : s.fetchFriendsStories()).finally(() => {
      if (!cancelled) setIsBootstrapping(false)
    })
    return () => {
      cancelled = true
    }
  }, [isBootstrapping, isMyStories])

  // Historias actuales
  const currentUserStories = isMyStories ? myStories : allUsers[currentUserIndex]?.stories || []

  const currentStory = currentUserStories[currentStoryIndex]
  const currentUser = isMyStories ? null : allUsers[currentUserIndex]

  // Key the lookup on the *set* of user ids, not on array identity:
  // `viewStory → incrementViewCount` rebuilds `friendsStories` on every view,
  // and re-running this on identity snapped `currentUserIndex` back to the
  // URL's user each time the viewer advanced to the next friend.
  const friendUserIdsKey = allUsers.map((u) => u.userId).join(',')
  useEffect(() => {
    if (isMyStories) return
    // Encontrar el índice del usuario cuyas historias queremos ver
    const userIndex = useStoryStore
      .getState()
      .friendsStories.findIndex((u) => u.userId === userId)
    if (userIndex !== -1) {
      setCurrentUserIndex(userIndex)
    }
  }, [userId, isMyStories, friendUserIdsKey])

  // Marcar historia como vista
  useEffect(() => {
    if (currentStory && !isMyStories) {
      viewStory(currentStory.id)
    }
  }, [currentStory?.id, isMyStories, viewStory])

  // Flag para indicar que debe avanzar a la siguiente historia
  const [shouldAdvance, setShouldAdvance] = useState(false)

  // Progreso automático
  useEffect(() => {
    if (!currentStory || isPaused) return

    const duration = currentStory.type === 'video' ? (currentStory.duration || 15) * 1000 : STORY_DURATION

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setShouldAdvance(true)
          return 100
        }
        return prev + (100 / duration) * 50 // Update every 50ms
      })
    }, 50)

    return () => clearInterval(interval)
  }, [currentStory, isPaused, currentStoryIndex, currentUserIndex])

  // Efecto para avanzar a la siguiente historia (evita setState durante render)
  useEffect(() => {
    if (shouldAdvance) {
      setShouldAdvance(false)
      setProgress(0)

      if (currentStoryIndex < currentUserStories.length - 1) {
        // Siguiente historia del mismo usuario
        setCurrentStoryIndex((prev) => prev + 1)
      } else if (!isMyStories && currentUserIndex < allUsers.length - 1) {
        // Siguiente usuario
        setCurrentUserIndex((prev) => prev + 1)
        setCurrentStoryIndex(0)
      } else {
        // Fin de las historias - volver al feed
        router.push('/feed')
      }
    }
  }, [
    shouldAdvance,
    currentStoryIndex,
    currentUserStories.length,
    isMyStories,
    currentUserIndex,
    allUsers.length,
    router,
  ])

  const handleNext = () => {
    if (currentStoryIndex < currentUserStories.length - 1) {
      // Siguiente historia del mismo usuario
      setCurrentStoryIndex((prev) => prev + 1)
      setProgress(0)
    } else if (!isMyStories && currentUserIndex < allUsers.length - 1) {
      // Siguiente usuario
      setCurrentUserIndex((prev) => prev + 1)
      setCurrentStoryIndex(0)
      setProgress(0)
    } else {
      // Fin de las historias - volver al feed
      router.push('/feed')
    }
  }

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      // Historia anterior del mismo usuario
      setCurrentStoryIndex((prev) => prev - 1)
      setProgress(0)
    } else if (!isMyStories && currentUserIndex > 0) {
      // Usuario anterior
      setCurrentUserIndex((prev) => prev - 1)
      setCurrentStoryIndex(0)
      setProgress(0)
    }
  }

  const handleClose = () => {
    router.push('/feed')
  }

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
