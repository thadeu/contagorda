import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'
import { BottomSheet } from './BottomSheet'

/**
 * Who owns a downward drag inside a sheet.
 *
 * In jsdom nothing has a height, so `scrollHeight <= clientHeight` holds and
 * every panel is the short kind — which is exactly the case that broke on a
 * phone: with few accounts the list does not scroll, the whole panel is
 * draggable, and pressing a row to reorder it pulled the sheet down instead.
 */
describe('Modal drag', () => {
  function open(children: React.ReactNode) {
    render(
      <Modal title="Contas" onClose={vi.fn()}>
        {children}
      </Modal>,
    )

    // By name: a sheet opened inside this one is a dialog too, and the panel
    // under test is the outer one.
    return screen.getByRole('dialog', { name: 'Contas' })
  }

  function press(target: Element) {
    fireEvent.touchStart(target, { touches: [{ clientY: 200 }] })
  }

  it('drags from content that has no drag of its own', () => {
    const panel = open(<p data-testid="text">Nubank</p>)

    press(screen.getByTestId('text'))

    expect(panel.dataset.dragging).toBe('true')
  })

  it('leaves the gesture to content that declares its own', () => {
    const panel = open(
      <ul>
        <li data-owns-drag data-testid="row">
          Nubank
        </li>
      </ul>,
    )

    press(screen.getByTestId('row'))

    expect(panel.dataset.dragging).toBe('false')
  })

  /**
   * A sheet opened from inside a form is the form's descendant in the React
   * tree, whatever the portals did to the DOM — so a touch it declines still
   * arrives here unless it is stopped. Scrolling the accounts list in the
   * picker moved the form behind it for exactly this reason, and only once that
   * list was long enough to scroll.
   */
  it('does not take a gesture that started in a sheet above it', () => {
    const panel = open(
      <BottomSheet title="Conta" onClose={vi.fn()}>
        <ul>
          <li data-testid="option">Nubank</li>
        </ul>
      </BottomSheet>,
    )

    // jsdom measures everything as zero, so the sheet's list has to be told it
    // scrolls — that is the condition that makes the sheet decline the drag and
    // hand the gesture on. Reached through the sheet's own dialog: both panels
    // give their scroller the same class, and the modal's must stay at zero, or
    // it would decline too and the test would pass without proving anything.
    const scroller = screen.getByRole('dialog', { name: 'Conta' }).querySelector('.sheet-scroll')!

    Object.defineProperty(scroller, 'scrollHeight', { value: 400, configurable: true })
    Object.defineProperty(scroller, 'clientHeight', { value: 100, configurable: true })

    press(screen.getByTestId('option'))

    expect(panel.dataset.dragging).toBe('false')
  })

  // The row is pressed somewhere — on the name, on the balance — never on the
  // element carrying the attribute.
  it('covers anything inside that row', () => {
    const panel = open(
      <ul>
        <li data-owns-drag>
          <button type="button">
            <span data-testid="name">Nubank</span>
          </button>
        </li>
      </ul>,
    )

    press(screen.getByTestId('name'))

    expect(panel.dataset.dragging).toBe('false')
  })
})
