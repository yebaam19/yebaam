'use client'

import { useEffect, useRef } from 'react'

/** Keep fullscreen content above mobile browser chrome and the on-screen keyboard. */
export function useVisibleViewport(enabled: boolean, mode: 'page' | 'docked' = 'page') {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    const viewport = window.visualViewport
    if (!enabled || !element || !viewport) return

    const update = () => {
      // Preserve native pinch-to-zoom instead of resizing the UI around it.
      if (viewport.scale !== 1) return
      // The browser may pan the page when focusing a field above the keyboard.
      const visibleBottom = viewport.height + viewport.offsetTop
      if (mode === 'docked') {
        element.style.bottom = `${Math.max(0, window.innerHeight - visibleBottom)}px`
        element.style.maxHeight = `${Math.max(0, viewport.height - 16)}px`
      } else {
        element.style.height = `${visibleBottom}px`
      }
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      element.style.removeProperty('height')
      element.style.removeProperty('bottom')
      element.style.removeProperty('max-height')
    }
  }, [enabled, mode])

  return ref
}
