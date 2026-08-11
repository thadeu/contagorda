import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRef } from 'react'
import { usePullToRefresh } from './usePullToRefresh'

/**
 * The gesture, without a phone.
 *
 * jsdom reports every element as zero-sized and never scrolls one, so `scrollTop`
 * is written directly to say where the list is. That is the whole condition the
 * hook turns on: at the top it may take a downward pull, anywhere else it may
 * not.
 */
function Screen({ onRefresh }: { onRefresh: () => Promise<unknown> }) {
  const content = useRef<HTMLDivElement>(null)
  const { refreshing } = usePullToRefresh(content, onRefresh)

  return (
    <main className="app-scroll" data-testid="scroller">
      <div ref={content} data-testid="content">
        {refreshing ? 'atualizando' : 'parado'}
      </div>
    </main>
  )
}

function pull(from: number, to: number) {
  const scroller = screen.getByTestId('scroller')

  fireEvent.touchStart(scroller, { touches: [{ clientY: from }] })
  fireEvent.touchMove(scroller, { touches: [{ clientY: to }] })
  fireEvent.touchEnd(scroller, { touches: [] })
}

describe('pull to refresh', () => {
  afterEach(() => {
    delete document.documentElement.dataset.overlayOpen
  })

  it('asks again when the pull is long enough', async () => {
    const onRefresh = vi.fn(() => Promise.resolve())

    render(<Screen onRefresh={onRefresh} />)

    // The content follows half the finger, so clearing a 64px threshold takes
    // more than 128px of travel.
    pull(100, 300)

    expect(onRefresh).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByTestId('content').textContent).toBe('parado'))
  })

  it('does not ask for a pull that stops short', () => {
    const onRefresh = vi.fn(() => Promise.resolve())

    render(<Screen onRefresh={onRefresh} />)

    pull(100, 140)

    expect(onRefresh).not.toHaveBeenCalled()
  })

  // Reading downward is not asking for anything.
  it('ignores a pull upward', () => {
    const onRefresh = vi.fn(() => Promise.resolve())

    render(<Screen onRefresh={onRefresh} />)

    pull(300, 100)

    expect(onRefresh).not.toHaveBeenCalled()
  })

  /**
   * The gesture belongs to the top of the list. Halfway down, the same movement
   * is a scroll, and the browser is already answering it.
   */
  it('stays out of the way when the list is not at its top', () => {
    const onRefresh = vi.fn(() => Promise.resolve())

    render(<Screen onRefresh={onRefresh} />)

    Object.defineProperty(screen.getByTestId('scroller'), 'scrollTop', { value: 200, writable: true })

    pull(100, 300)

    expect(onRefresh).not.toHaveBeenCalled()
  })

  // A covered page is not being read, and locking the scroller for a sheet
  // moves it on its own.
  it('stays out of the way while a sheet is up', () => {
    const onRefresh = vi.fn(() => Promise.resolve())

    render(<Screen onRefresh={onRefresh} />)

    document.documentElement.dataset.overlayOpen = 'true'

    pull(100, 300)

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('holds the content open until the answer arrives', async () => {
    let settle = () => {}
    const onRefresh = vi.fn(() => new Promise<void>((resolve) => (settle = resolve)))

    render(<Screen onRefresh={onRefresh} />)

    pull(100, 300)

    await waitFor(() => expect(screen.getByTestId('content').textContent).toBe('atualizando'))
    expect(screen.getByTestId('content').style.transform).toBe('translateY(48px)')

    settle()

    await waitFor(() => expect(screen.getByTestId('content').textContent).toBe('parado'))
    expect(screen.getByTestId('content').style.transform).toBe('')
  })
})
