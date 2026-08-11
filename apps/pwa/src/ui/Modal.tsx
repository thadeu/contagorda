import { useRef, useState, type ReactNode } from 'react'
import { CloseIcon } from './icons'
import { NavBar, NavButton } from './NavBar'
import { useBodyScrollLock } from './useBodyScrollLock'
import { useDragLock } from './useDragLock'
import { useScrollable } from './useScrollable'
import { Portal } from './Portal'
import { useEnter } from './useEnter'
import { useExit } from './useExit'
import { useTouchScrollGuard } from './useTouchScrollGuard'

interface ModalProps {
  title: string
  onClose: () => void
  /** The screen's own action, opposite the close button. */
  trailing?: ReactNode
  children: ReactNode
}

/** Far enough that scrolling the form cannot dismiss it by accident. */
const THRESHOLD = 90

/**
 * A task presented over the app, not a place you travel to.
 *
 * Creating a transaction is a few seconds of work that ends where it started,
 * and a route says the opposite: it puts the task in the address bar, gives it a
 * back button, and asks the person to navigate their way home. The app stays
 * visible above this panel, which is the whole message — you are still on the
 * month, with something in front of it.
 *
 * The panel bleeds below its own bottom edge. A `position: fixed` box is inset
 * by the safe areas in the installed app, so a panel meant to meet the bottom of
 * the screen stops short of it and the dimmed page shows through as a band. The
 * backdrop solves this for itself with `-inset-y-24`; the panel needs the same,
 * and cannot use a negative inset without moving the content inside it.
 *
 * The grab area declares `touch-action: none`, like every other draggable
 * surface here. Without it the browser reads the same downward pull as a scroll
 * and moves the page behind while the panel follows the finger — two things
 * travelling at once, one of them the screen that was supposed to stay put.
 *
 * It is deliberately not `BottomSheet`. That one is a short list of actions, and
 * its detents exist so a long list can be pulled taller. A form has one height:
 * as much as it needs, up to nearly the screen. Sharing a component between the
 * two would mean a prop for every place they disagree.
 */
export function Modal({ title, onClose, trailing, children }: ModalProps) {
  const overlay = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const startY = useRef<number | null>(null)

  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  const lock = useDragLock()
  const entered = useEnter()
  const { leaving, requestClose } = useExit(onClose)
  const [flung, setFlung] = useState(false)

  useBodyScrollLock()
  useTouchScrollGuard(overlay, content)
  useScrollable(content)

  /**
   * A drag starts anywhere on the panel except inside a list that can actually
   * scroll. A form usually can, so in practice this is the heading — but a short
   * one is draggable everywhere, which is what a native sheet does and what
   * makes it feel like an object rather than a window with a handle.
   *
   * And except on content that runs a drag of its own, which says so with
   * `data-owns-drag`. A reorderable row is the case: it is held and moved, and
   * on a list short enough not to scroll every one of those gestures was also
   * pulling the sheet down — two things travelling from one finger. The element
   * that has its own answer for the gesture keeps it.
   */
  function draggableFrom(target: EventTarget | null): boolean {
    const node = content.current

    if (!node || !(target instanceof Node)) return true

    if (target instanceof Element && target.closest('[data-owns-drag]')) return false

    if (!node.contains(target)) return true

    return node.scrollHeight <= node.clientHeight
  }

  function handleTouchStart(event: React.TouchEvent) {
    /*
     * The innermost sheet takes the gesture and nobody else hears about it.
     * React dispatches through the component tree, where a sheet opened from
     * inside another one is its descendant however the portals arranged the DOM
     * — so without this, dragging the category sheet drags the transaction modal
     * underneath it, and every panel in the stack moves at once.
     *
     * Before the decision below and not after it: a gesture this panel declines
     * to drag with — a scrolling list, a row that reorders by being held — is
     * still this panel's gesture, and a panel further out must not inherit it
     * for having heard it last.
     */
    event.stopPropagation()

    if (!draggableFrom(event.target)) return

    startY.current = event.touches[0].clientY
    setDragging(true)
    lock.start()
  }

  function handleTouchMove(event: React.TouchEvent) {
    event.stopPropagation()

    if (startY.current === null) return

    setOffset(Math.max(event.touches[0].clientY - startY.current, 0))
  }

  function handleTouchEnd(event: React.TouchEvent) {
    event.stopPropagation()

    if (offset > THRESHOLD) {
      setFlung(true)
      requestClose()
    }

    setOffset(0)
    setDragging(false)
    startY.current = null
    lock.end()
  }

  return (
    <Portal>
      <div ref={overlay} className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={requestClose}
        className={`fade-in absolute inset-x-0 -inset-y-24 touch-none bg-black/45 ${
          entered && !leaving ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-dragging={dragging}
        data-leaving={leaving && !flung}
        style={{
          transform:
            entered && !leaving ? `translateY(${offset}px)` : 'translateY(100%)',
        }}
        className="sheet-snap relative flex h-[calc(100%-env(safe-area-inset-top)-2.5rem)] w-full max-w-lg flex-col rounded-t-card bg-overlay"
      >
        <div className="shrink-0 touch-none select-none">
          <div className="flex justify-center pt-2" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-ink/30" />
          </div>

          <NavBar
            title={title}
            leading={<NavButton icon={CloseIcon} label="Fechar" onClick={requestClose} />}
            trailing={trailing}
          />
        </div>

        <div
          ref={content}
          className="sheet-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </div>

        <div aria-hidden="true" className="absolute inset-x-0 top-full h-24 bg-surface" />
      </div>
      </div>
    </Portal>
  )
}
