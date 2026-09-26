'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const FriendSuggestionsCompact = dynamic(
  () => import('@/features/user/components/FriendSuggestionCard').then((mod) => mod.FriendSuggestionsCompact),
  {
    ssr: false,
    loading: () => <div role="status" aria-label="Cargando sugerencias" className="h-52 animate-pulse bg-neutral-100 dark:bg-neutral-800" />,
  },
)

export default function DeferredFriendSuggestions() {
  const target = useRef<HTMLDivElement>(null)
  const [isNear, setIsNear] = useState(false)

  useEffect(() => {
    if (isNear) return
    if (!('IntersectionObserver' in window)) {
      const frame = requestAnimationFrame(() => setIsNear(true))
      return () => cancelAnimationFrame(frame)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsNear(true)
      },
      { rootMargin: '600px' },
    )
    const element = target.current
    if (element) observer.observe(element)
    return () => observer.disconnect()
  }, [isNear])

  return (
    <div ref={target} className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {isNear && <FriendSuggestionsCompact limit={4} />}
    </div>
  )
}
