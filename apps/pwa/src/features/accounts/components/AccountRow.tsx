import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Money } from '@/ui/Money'
import { DragHandleIcon } from '@/ui/icons'
import { kindLabel } from '../accountKinds'
import type { Account } from '@/services/types'

/**
 * One account, dragged by pressing anywhere on it.
 *
 * The grip is not what listens — it is what tells you there is something to
 * listen for. A press-and-hold has no outward sign, and a list that reorders on
 * a gesture nobody can see is a list that reorders by accident; the icon is the
 * sign, and the whole row is the target.
 *
 * `touch-manipulation` rather than `touch-none`: the browser has to keep owning
 * the gesture until the press wins it, or the list stops scrolling. A finger
 * that moves before the delay is over is scrolling, and the sensor's tolerance
 * is what says so.
 */
export function AccountRow({
  account,
  startCents,
  balanceCents,
  onOpen,
}: {
  account: Account
  startCents: number
  balanceCents: number
  onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: account.id,
    // The row is a row. dnd-kit calls its draggables buttons by default, which
    // here would nest one interactive element inside another and announce the
    // wrong thing to a screen reader — `tabIndex` from the attributes is what
    // actually makes it reachable, and reordering by keyboard still works.
    attributes: { role: 'listitem', roleDescription: 'conta, mantenha pressionado para reordenar' },
  })

  return (
    <li
      ref={setNodeRef}
      data-owns-drag
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex touch-manipulation items-center gap-1 ${isDragging ? 'relative z-10 bg-surface opacity-80' : ''}`}
      {...attributes}
      {...listeners}
    >
      <span className="-ml-2 shrink-0 p-2 text-muted">
        <DragHandleIcon size={18} />
      </span>

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3.5 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-[0.9375rem] font-medium text-ink">{account.name}</p>
          <p className="truncate text-xs text-muted">
            {kindLabel(account.kind)}
            {account.institution && ` · ${account.institution}`}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <Money cents={balanceCents} className="text-[0.9375rem] font-semibold" />
          <p className="text-xs text-muted">
            Início <Money cents={startCents} />
          </p>
        </div>
      </button>
    </li>
  )
}
