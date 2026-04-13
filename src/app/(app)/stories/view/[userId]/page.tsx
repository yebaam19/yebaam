'use client'

import Avatar from '@/ui/Avatar'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useStorySocket } from '../../hooks/useStorySocket'
import { useStoryStore } from '../../store'

export default function ViewStoryPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const { friendsStories, myStories, viewStory } = useStoryStore()
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

  // Historias actuales
  const currentUserStories = isMyStories ? myStories : allUsers[currentUserIndex]?.stories || []

  const currentStory = currentUserStories[currentStoryIndex]
  const currentUser = isMyStories ? null : allUsers[currentUserIndex]

  // Log para verificar datos de la historia

  // Duración por tipo de historia
  const STORY_DURATION = 15000 // 15 segundos para imágenes
  const VIDEO_DURATION_MULTIPLIER = 1 // Los videos usan su duración real

  useEffect(() => {
    if (!isMyStories) {
      // Encontrar el índice del usuario cuyas historias queremos ver
      const userIndex = allUsers.findIndex((u) => u.userId === userId)
      if (userIndex !== -1) {
        setCurrentUserIndex(userIndex)
      }
    }
  }, [userId, allUsers, isMyStories])

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

  if (!currentStory) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950">
        <p className="text-white">No hay historias para mostrar</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header con progreso */}
      <div className="absolute top-0 right-0 left-0 z-20 bg-linear-to-b from-black/80 to-transparent p-4">
        {/* Barras de progreso */}
        <div className="mb-4 flex gap-1">
          {currentUserStories.map((_, index) => (
            <div key={index} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: index < currentStoryIndex ? '100%' : index === currentStoryIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Info del usuario */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMyStories ? (
              <>
                <div className="h-10 w-10 rounded-full bg-primary-600" />
                <div>
                  <p className="font-semibold text-white">Tu historia</p>
                  <p className="text-sm text-white/60">
                    {new Date(currentStory.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </>
            ) : (
              currentUser && (
                <>
                  <Avatar
                    initials={currentUser.username.substring(0, 2).toUpperCase()}
                    src={currentUser.avatarUrl}
                    className="h-10 w-10"
                  />
                  <div>
                    <p className="font-semibold text-white">{currentUser.fullName}</p>
                    <p className="text-sm text-white/60">@{currentUser.username}</p>
                  </div>
                </>
              )
            )}
          </div>

          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      {/* Contenido de la historia */}
      <div className="flex h-full w-full items-center justify-center">
        <div className="relative h-full w-full max-w-md">
          {currentStory.type === 'image' && (
            <img src={currentStory.mediaUrl} alt="Story" className="h-full w-full object-cover" />
          )}

          {currentStory.type === 'video' && (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              onEnded={handleNext}
              onPause={() => setIsPaused(true)}
              onPlay={() => setIsPaused(false)}
            />
          )}

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/80 to-transparent p-6">
              <p className="text-center text-white">{currentStory.caption}</p>
            </div>
          )}

          {/* Controles de navegación */}
          <button
            onClick={handlePrevious}
            className="absolute top-1/2 left-4 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-colors hover:bg-black/40"
            disabled={currentStoryIndex === 0 && (isMyStories || currentUserIndex === 0)}
          >
            <ChevronLeftIcon className="h-6 w-6 text-white" />
          </button>

          <button
            onClick={handleNext}
            className="absolute top-1/2 right-4 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-colors hover:bg-black/40"
          >
            <ChevronRightIcon className="h-6 w-6 text-white" />
          </button>

          {/* Áreas táctiles para navegación */}
          <div className="absolute inset-0 flex">
            <button
              className="flex-1"
              onClick={handlePrevious}
              disabled={currentStoryIndex === 0 && (isMyStories || currentUserIndex === 0)}
            />
            <button className="flex-1" onClick={handleNext} />
          </div>
        </div>
      </div>

      {/* Stats para mis historias */}
      {isMyStories && (
        <div className="absolute right-0 bottom-8 left-0 flex justify-center">
          <div className="rounded-full bg-black/60 px-6 py-3 backdrop-blur-sm">
            <p className="text-sm text-white">
              {currentStory.viewCount} {currentStory.viewCount === 1 ? 'vista' : 'vistas'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
