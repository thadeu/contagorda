import { Button } from './Button'
import { Portal } from './Portal'
import { useEnter } from './useEnter'

interface ConfirmSheetProps {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  pending?: boolean
  /** Marks the action as destructive rather than merely consequential. */
  danger?: boolean
}

/**
 * Asking before something cannot be undone.
 *
 * It replaces `window.confirm`, which cannot be styled, cannot be dismissed by
 * tapping away, and in an installed PWA on iOS announces the domain it came from
 * — telling anyone who reads it that this is a web page pretending otherwise.
 *
 * It deliberately does not lock the page. What is underneath is already a modal
 * or a sheet that locked it, and locking twice means the first to unmount
 * unlocks for both — the confirm closes and the screen behind it starts
 * scrolling under a panel that is still open.
 *
 * The confirming action is on the right and named after what it does. "OK"
 * beside a question is a coin toss for anyone who read the title and not the
 * body, which is most people most of the time.
 */
export function ConfirmSheet({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  pending = false,
  danger = false,
}: ConfirmSheetProps) {
  const entered = useEnter()

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className={`fade-in absolute inset-x-0 -inset-y-24 bg-black/45 ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        style={{ transform: entered ? 'translateY(0)' : 'translateY(100%)' }}
        className="sheet-snap relative mx-2 mb-2 w-full max-w-md rounded-card bg-overlay p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      >
        <p className="text-base font-semibold text-ink">{title}</p>
        <p className="pt-1 text-sm leading-relaxed text-muted">{message}</p>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>

          <Button
            type="button"
            variant={danger ? 'danger' : 'primary'}
            className="flex-1"
            disabled={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
      </div>
    </Portal>
  )
}
