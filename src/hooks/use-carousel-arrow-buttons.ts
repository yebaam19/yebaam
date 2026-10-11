import { EmblaCarouselType } from 'embla-carousel'
import { useCallback, useSyncExternalStore } from 'react'

type UsePrevNextButtonsType = {
  prevBtnDisabled: boolean
  nextBtnDisabled: boolean
  onPrevButtonClick: () => void
  onNextButtonClick: () => void
}

export const useCarouselArrowButtons = (emblaApi: EmblaCarouselType | undefined): UsePrevNextButtonsType => {
  const subscribe = useCallback((notify: () => void) => {
    emblaApi?.on('reInit', notify).on('select', notify)
    return () => { emblaApi?.off('reInit', notify).off('select', notify) }
  }, [emblaApi])
  const getSnapshot = useCallback(() =>
    (emblaApi?.canScrollPrev() ? 1 : 0) | (emblaApi?.canScrollNext() ? 2 : 0), [emblaApi])
  const available = useSyncExternalStore(subscribe, getSnapshot, () => 0)
  const onPrevButtonClick = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const onNextButtonClick = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  return {
    prevBtnDisabled: !(available & 1),
    nextBtnDisabled: !(available & 2),
    onPrevButtonClick,
    onNextButtonClick,
  }
}
