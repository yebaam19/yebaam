'use client'

import { useEffect, useRef } from 'react'

/** Keep fullscreen content above mobile browser chrome and the on-screen keyboard. */
export function useVisibleViewport(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    const viewport = window.visualViewport
    if (!enabled || !element || !viewport) return

    const update = () => {
      // Preserve native pinch-to-zoom instead of resizing the UI around it.
      if (viewport.scale !== 1) return
      // The browser may pan the page when focusing a field above the keyboard.
      element.style.height = `${viewport.height + viewport.offsetTop}px`
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      element.style.removeProperty('height')
    }
  }, [enabled])

  return ref
}
