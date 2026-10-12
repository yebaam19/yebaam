import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useVisibleViewport } from '@/lib/hooks/useVisibleViewport'

function Fullscreen({ enabled = true }: { enabled?: boolean }) {
  const ref = useVisibleViewport(enabled)
  return <div ref={ref} data-testid="viewport" />
}

function mockViewport() {
  const viewport = Object.assign(new EventTarget(), {
    height: 844,
    offsetTop: 0,
    scale: 1,
  })
  vi.stubGlobal('visualViewport', viewport)
  return viewport
}

afterEach(() => vi.unstubAllGlobals())

describe('fullscreen visible viewport', () => {
  it('keeps the bottom above the keyboard, including browser panning, and restores it on close', () => {
    const viewport = mockViewport()
    render(<Fullscreen />)
    const container = screen.getByTestId('viewport')
    expect(container.style.height).toBe('844px')

    act(() => {
      viewport.height = 420
      viewport.dispatchEvent(new Event('resize'))
    })
    expect(container.style.height).toBe('420px')

    act(() => {
      viewport.offsetTop = 56
      viewport.dispatchEvent(new Event('scroll'))
    })
    expect(container.style.height).toBe('476px')

    act(() => {
      viewport.height = 844
      viewport.offsetTop = 0
      viewport.dispatchEvent(new Event('resize'))
    })
    expect(container.style.height).toBe('844px')
  })

  it('allows native pinch zoom without shrinking the layout', () => {
    const viewport = mockViewport()
    render(<Fullscreen />)
    act(() => {
      viewport.scale = 2
      viewport.height = 422
      viewport.dispatchEvent(new Event('resize'))
    })
    expect(screen.getByTestId('viewport').style.height).toBe('844px')
  })

  it('cleans up its height and listeners when returning to a regular page', () => {
    const viewport = mockViewport()
    const remove = vi.spyOn(viewport, 'removeEventListener')
    const view = render(<Fullscreen />)
    view.rerender(<Fullscreen enabled={false} />)
    expect(screen.getByTestId('viewport').style.height).toBe('')
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
    act(() => viewport.dispatchEvent(new Event('resize')))
    expect(screen.getByTestId('viewport').style.height).toBe('')
  })

  it('leaves regular pages and browsers without VisualViewport to CSS', () => {
    mockViewport()
    const view = render(<Fullscreen enabled={false} />)
    expect(screen.getByTestId('viewport').style.height).toBe('')
    vi.stubGlobal('visualViewport', undefined)
    view.rerender(<Fullscreen />)
    expect(screen.getByTestId('viewport').style.height).toBe('')
  })
})
