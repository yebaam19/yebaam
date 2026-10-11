import { EmblaCarouselType } from 'embla-carousel'
import { useCallback, useSyncExternalStore } from 'react'

type UseDotButtonType = {
  selectedIndex: number
  scrollSnaps: number[]
  onDotButtonClick: (index: number) => void
}

const EMPTY_SNAPS: number[] = []

export const useCarouselDotButton = (emblaApi: EmblaCarouselType | undefined): UseDotButtonType => {
  const subscribe = useCallback((notify: () => void) => {
    emblaApi?.on('reInit', notify).on('select', notify)
    return () => { emblaApi?.off('reInit', notify).off('select', notify) }
  }, [emblaApi])
  const getIndex = useCallback(() => emblaApi?.selectedScrollSnap() ?? 0, [emblaApi])
  const getSnaps = useCallback(() => emblaApi?.scrollSnapList() ?? EMPTY_SNAPS, [emblaApi])
  const selectedIndex = useSyncExternalStore(subscribe, getIndex, () => 0)
  const scrollSnaps = useSyncExternalStore(subscribe, getSnaps, () => EMPTY_SNAPS)
  const onDotButtonClick = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])
  return { selectedIndex, scrollSnaps, onDotButtonClick }
}
