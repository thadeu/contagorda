import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Modal } from '@/ui/Modal'
import { NavButton } from '@/ui/NavBar'
import { useAccounts, useOpeningBalances, useReorderAccounts } from './hooks'
import { useAccountEditor } from './accountEditorContext'
import { useMonth } from '@/app/useMonth'
import { monthLabel } from '@/lib/dates'
import { useTransactions } from '@/features/transactions/hooks'
import { Button } from '@/ui/Button'
import { EmptyState } from '@/ui/EmptyState'
import { PlusIcon } from '@/ui/icons'
import { balanceFor } from './accountBalance'
import { AccountRow } from './components/AccountRow'

/**
 * Accounts, presented rather than travelled to.
 *
 * It was a screen with a back button, which made it somewhere you go — but you
 * do not go to accounts, you glance at them and return to the month you were
 * reading. A sheet says that: the month stays behind it, and closing puts you
 * back exactly where you were rather than navigating you there.
 *
 * The form opens over this one, and the confirm over that. Three deep is not a
 * mistake here — each is a smaller question about the thing underneath it, and
 * closing one answers it and leaves the rest standing.
 */
/**
 * Both of these are about the press. Without them, holding a row highlights its
 * text and iOS offers to copy it, so the drag begins underneath a selection
 * nobody asked for. They inherit, so the list declares them once for every row.
 */
const LIST = 'mx-4 divide-y divide-line rounded-card bg-surface px-4 [-webkit-touch-callout:none] select-none'

export function AccountsSheet({ onClose }: { onClose: () => void }) {
  const { month } = useMonth()
  const accounts = useAccounts()
  const opening = useOpeningBalances(month)
  const transactions = useTransactions(month)
  const editor = useAccountEditor()
  const reorder = useReorderAccounts()

  const rows = transactions.data ?? []
  const list = accounts.data ?? []

  // Touch and mouse are separate sensors rather than the one pointer sensor
  // that covers both, because only the touch one can stop iOS from scrolling
  // the list while a row is being carried up it: it listens to `touchmove` and
  // cancels it, and a `pointermove` cancelled instead leaves Safari scrolling
  // and dragging at the same time.
  //
  // Held, not swiped. The whole row is the target, so time is what separates
  // the three things a finger can mean on it: a tap opens the account, a swipe
  // scrolls the list, and only a press that stays put a quarter of a second
  // starts a drag. The tolerance is the escape hatch — a finger that travels
  // more than 5px before that is scrolling, and the drag never begins.
  //
  // 250ms and not more: iOS raises its own callout at around half a second, and
  // the drag has to have taken the gesture before that shows up.
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return

    const from = list.findIndex((a) => a.id === active.id)
    const to = list.findIndex((a) => a.id === over.id)

    if (from === -1 || to === -1) return

    reorder.mutate(arrayMove(list, from, to).map((a) => a.id))
  }

  return (
    <Modal
      title="Contas"
      onClose={onClose}
      trailing={<NavButton primary icon={PlusIcon} label="Nova conta" onClick={editor.openNew} />}
    >
      <p className="px-4 pb-3 text-sm text-muted first-letter:uppercase">{monthLabel(month)}</p>

      {accounts.isSuccess && list.length === 0 && (
        <EmptyState
          title="Nenhuma conta ainda"
          hint="Cadastre onde o dinheiro entra e sai para começar a lançar."
          action={<Button onClick={editor.openNew}>Cadastrar conta</Button>}
        />
      )}

      {list.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={list.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <ul className={LIST}>
              {list.map((account) => {
                const startCents = opening.data?.[account.id] ?? 0

                return (
                  <AccountRow
                    key={account.id}
                    account={account}
                    startCents={startCents}
                    balanceCents={balanceFor(account.id, startCents, rows)}
                    onOpen={() => editor.openEdit(account.id)}
                  />
                )
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </Modal>
  )
}
