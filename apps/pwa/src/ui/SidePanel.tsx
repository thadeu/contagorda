import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from './icons'
import { NavBar, NavButton } from './NavBar'

interface SidePanelProps {
  title: string
  subtitle?: string
  onClose: () => void
  trailing?: ReactNode
  children: ReactNode
  host: HTMLElement
}

/**
 * What a `Modal` becomes on the desktop: a column beside the content, not a
 * sheet over it.
 *
 * The page stays where it was and stays usable. That is the point of the panel
 * — the list is the context for whatever is being edited, and on a screen this
 * wide there is room to keep both in view.
 *
 * Panels stack in the same column. A form opened from inside another form (a
 * new category from the transaction form) covers the first one, and closing it
 * gives the first one back as it was left.
 *
 * Escape closes the top panel only. Every panel listens, so each one asks
 * whether it is the last child of the column before acting on the key.
 */
export function SidePanel({ title, subtitle, onClose, trailing, children, host }: SidePanelProps) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key !== 'Escape' || host.lastElementChild !== panel.current) return

      event.preventDefault()
      onClose()
    }

    window.addEventListener('keydown', handleKey)

    return () => window.removeEventListener('keydown', handleKey)
  }, [host, onClose])

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-label={title}
      className="panel-enter absolute inset-0 flex flex-col bg-overlay"
    >
      <div className="shrink-0 border-b border-line">
        <NavBar
          title={title}
          leading={<NavButton icon={CloseIcon} label="Fechar (Esc)" onClick={onClose} />}
          trailing={trailing}
        />

        {subtitle && <p className="-mt-1 px-4 pb-3 text-center text-sm text-muted">{subtitle}</p>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">{children}</div>
    </div>,
    host,
  )
}
